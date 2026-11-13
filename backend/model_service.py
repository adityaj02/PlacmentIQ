"""
PlacementIQ – Model Service Singleton
Directly utilizes the serialized scikit-learn Pipeline and fitted Preprocessor
to guarantee 100% inference and explainability consistency with training.
NO duplicate preprocessing logic is introduced.
"""
import sys
from pathlib import Path
import json
import logging
import numpy as np
import pandas as pd
import joblib

# Add src to path to import predict and explainability utilities
SRC_DIR = Path(__file__).parent.parent / 'src'
if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))

from predict import SKILL_GAP_THRESHOLDS, RECOMMENDATIONS
from explainability import _get_transformed_data_and_names

try:
    import shap
    SHAP_AVAILABLE = True
except ImportError:
    shap = None
    SHAP_AVAILABLE = False

logger = logging.getLogger(__name__)

MODELS_DIR = Path(__file__).parent.parent / 'models'
MODEL_PATH = MODELS_DIR / 'placement_model.joblib'
METADATA_PATH = MODELS_DIR / 'model_metadata.json'
SCHEMA_PATH = MODELS_DIR / 'feature_schema.json'


class ModelService:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ModelService, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return

        self.model_version = "placement-xgb-v1"
        self.default_threshold = 0.50
        self.f1_optimal_threshold = 0.35
        self.metadata = {}
        self.schema = {}
        self.pipeline = None
        self.explainer = None
        self.feature_names = []

        self._load_artifacts()
        self._initialize_shap()
        self._initialized = True

    def _load_artifacts(self):
        """Loads serialized pipeline and metadata from disk."""
        if not MODEL_PATH.exists():
            raise FileNotFoundError(f"Model artifact not found at {MODEL_PATH}")

        logger.info(f"Loading production pipeline from {MODEL_PATH}")
        self.pipeline = joblib.load(MODEL_PATH)

        if METADATA_PATH.exists():
            with open(METADATA_PATH) as f:
                self.metadata = json.load(f)
                self.f1_optimal_threshold = self.metadata.get('classification_threshold', 0.35)

        if SCHEMA_PATH.exists():
            with open(SCHEMA_PATH) as f:
                self.schema = json.load(f)

        # Extract transformed feature names directly from fitted pipeline preprocessor
        preprocessor = self.pipeline.named_steps['preprocessor']
        num_names = list(preprocessor.transformers_[0][2])
        cat_encoder = preprocessor.named_transformers_['cat'].named_steps['encoder']
        cat_input_cols = preprocessor.transformers_[1][2]
        cat_names = list(cat_encoder.get_feature_names_out(cat_input_cols))
        self.feature_names = num_names + cat_names
        logger.info(f"Loaded pipeline successfully. Transformed feature dimensions: {len(self.feature_names)}")

    def _initialize_shap(self):
        """Initializes TreeExplainer once on startup using the trained classifier."""
        if not SHAP_AVAILABLE:
            logger.warning("SHAP library unavailable. Explainability endpoint will be disabled.")
            return

        try:
            classifier = self.pipeline.named_steps['classifier']
            self.explainer = shap.TreeExplainer(classifier)
            logger.info("SHAP TreeExplainer initialized successfully.")
        except Exception as e:
            logger.error(f"Failed to initialize TreeExplainer: {e}")
            self.explainer = None

    def _extract_model_features(self, student_dict: dict) -> dict:
        """Extract only the exact feature subset expected by the trained pipeline."""
        feature_cols = self.schema.get("all_features") or [
            "cgpa", "backlogs", "coding_skills", "dsa_score", "aptitude_score",
            "communication_skills", "ml_knowledge", "system_design", "internships",
            "projects_count", "certifications", "hackathons", "open_source_contributions",
            "extracurriculars", "branch", "college_tier"
        ]
        return {col: student_dict.get(col, 0 if col not in ['branch', 'college_tier'] else 'CSE') for col in feature_cols}

    def predict(self, student_dict: dict, threshold: float = 0.50) -> dict:
        """
        Runs inference on raw student feature dictionary.
        The pipeline's internal fitted ColumnTransformer executes all transformations.
        """
        name = student_dict.get('name', 'Student')
        uid = student_dict.get('uid', '')

        # Filter features to those expected by pipeline preprocessor
        row = self._extract_model_features(student_dict)
        df = pd.DataFrame([row])

        # Predict probability directly from composite pipeline
        prob = float(self.pipeline.predict_proba(df)[0, 1])
        status = int(prob >= threshold)

        if prob >= 0.75:
            confidence = "High"
        elif prob >= 0.55:
            confidence = "Moderate"
        else:
            confidence = "Low"

        return {
            "name": name,
            "uid": uid,
            "predicted_status": status,
            "placement_label": "Placed" if status == 1 else "Not Placed",
            "placement_probability": round(prob, 4),
            "decision_threshold": round(threshold, 2),
            "confidence": confidence,
            "model_version": self.model_version,
            "disclaimer": "Placement Cell evaluation based on trained institutional student performance data."
        }

    def batch_predict(self, student_list: list, threshold: float = 0.50) -> dict:
        """Runs batch inference on a list of student profile dicts."""
        rows = [self._extract_model_features(s) for s in student_list]
        df = pd.DataFrame(rows)
        probs = self.pipeline.predict_proba(df)[:, 1]

        results = []
        placed_count = 0
        for i, s in enumerate(student_list):
            prob = float(probs[i])
            status = int(prob >= threshold)
            if status == 1:
                placed_count += 1
            results.append({
                "name": s.get('name', f"Student {i+1}"),
                "uid": s.get('uid', f"UID-{i+1}"),
                "predicted_status": status,
                "placement_label": "Placed" if status == 1 else "Not Placed",
                "placement_probability": round(prob, 4),
                "decision_threshold": round(threshold, 2),
                "confidence": "High" if prob >= 0.75 else ("Moderate" if prob >= 0.55 else "Low"),
                "model_version": self.model_version,
                "disclaimer": "Placement Cell evaluation based on trained institutional student performance data."
            })

        total = len(student_list)
        return {
            "total_evaluated": total,
            "placed_count": placed_count,
            "not_placed_count": total - placed_count,
            "placement_rate": round((placed_count / total * 100), 2) if total > 0 else 0.0,
            "results": results
        }

    def explain(self, student_dict: dict, threshold: float = 0.50, top_n: int = 15) -> dict:
        """Generates local SHAP feature contributions for an individual profile."""
        if self.explainer is None:
            raise RuntimeError("SHAP explainer is not available.")

        row = self._extract_model_features(student_dict)
        df = pd.DataFrame([row])
        prob = float(self.pipeline.predict_proba(df)[0, 1])
        status = int(prob >= threshold)

        # Transform using exact fitted preprocessor
        preprocessor = self.pipeline.named_steps['preprocessor']
        X_transformed = preprocessor.transform(df)

        raw_shap = self.explainer(X_transformed)
        if hasattr(raw_shap, 'values'):
            vals = raw_shap.values[0]
        else:
            vals = raw_shap[0]

        if vals.ndim == 2:  # Binary class index 1
            vals = vals[:, 1]

        base_val = float(getattr(self.explainer, 'expected_value', 0.0))
        if isinstance(base_val, (list, np.ndarray)):
            base_val = float(base_val[1] if len(base_val) > 1 else base_val[0])

        contributions = []
        for feat, val in zip(self.feature_names, vals):
            raw_val = student_dict.get(feat, None)
            if raw_val is None:
                # check one-hot category match
                for cat_col in ['branch', 'college_tier']:
                    prefix = f"{cat_col}_"
                    if feat.startswith(prefix):
                        active_cat = feat[len(prefix):]
                        raw_val = 1 if student_dict.get(cat_col) == active_cat else 0

            contributions.append({
                "feature": feat,
                "shap_value": round(float(val), 4),
                "direction": "positive" if val >= 0 else "negative",
                "feature_value": raw_val
            })

        # Sort by absolute SHAP impact
        contributions.sort(key=lambda x: abs(x['shap_value']), reverse=True)

        return {
            "placement_probability": round(prob, 4),
            "predicted_status": status,
            "decision_threshold": round(threshold, 2),
            "base_value": round(base_val, 4),
            "contributions": contributions[:top_n],
            "model_version": self.model_version,
            "disclaimer": "SHAP feature contributions explain model sensitivity, not real-world causation."
        }

    def analyze_skill_gaps(self, student_dict: dict) -> dict:
        """Compares profile to benchmark thresholds and generates actionable advice."""
        gaps = []
        total_benchmarks = len(SKILL_GAP_THRESHOLDS)
        passed_count = 0

        for skill, bench_val in SKILL_GAP_THRESHOLDS.items():
            val = student_dict.get(skill)
            if val is None:
                continue

            if skill == 'backlogs':
                is_gap = val > bench_val
                gap_mag = max(0, val - bench_val)
            else:
                is_gap = val < bench_val
                gap_mag = max(0, bench_val - val)

            if is_gap:
                gaps.append({
                    "skill": skill,
                    "student_value": val,
                    "benchmark": bench_val,
                    "gap": round(float(gap_mag), 2),
                    "recommendation": RECOMMENDATIONS.get(skill, "Focus on building proficiency in this skill area.")
                })
            else:
                passed_count += 1

        gaps.sort(key=lambda x: x['gap'], reverse=True)
        readiness_score = round((passed_count / total_benchmarks) * 100, 1)

        return {
            "total_gaps_identified": len(gaps),
            "readiness_score": readiness_score,
            "gaps": gaps,
            "benchmarks_used": SKILL_GAP_THRESHOLDS,
            "disclaimer": "Skill-gap benchmarks reflect typical thresholds of placed cohorts in the training data."
        }

    def simulate(self, original_dict: dict, modifications: dict, threshold: float = 0.50) -> dict:
        """Simulates how modifications to student attributes impact placement probability."""
        modified_dict = {**original_dict, **modifications}

        orig_res = self.predict(original_dict, threshold=threshold)
        mod_res = self.predict(modified_dict, threshold=threshold)

        diff = round(mod_res['placement_probability'] - orig_res['placement_probability'], 4)
        pct_change = round(diff * 100, 2)

        if pct_change > 0:
            direction = "improvement"
        elif pct_change < 0:
            direction = "decline"
        else:
            direction = "no_change"

        changes = []
        for k, v in modifications.items():
            if k in original_dict and original_dict[k] != v:
                changes.append({
                    "feature": k,
                    "original": original_dict[k],
                    "modified": v
                })

        return {
            "original_probability": orig_res['placement_probability'],
            "original_status": orig_res['predicted_status'],
            "modified_probability": mod_res['placement_probability'],
            "modified_status": mod_res['predicted_status'],
            "probability_change_pct": pct_change,
            "direction": direction,
            "decision_threshold": round(threshold, 2),
            "feature_changes": changes,
            "disclaimer": "What-if simulation demonstrates model response to hypothetical changes; not a guarantee of real outcomes."
        }


# Global singleton access
model_service = ModelService()
