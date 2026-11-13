"""
PlacementIQ – Model Training Module
Trains Logistic Regression, Random Forest, Extra Trees, and XGBoost
using stratified K-fold cross-validation and optional hyperparameter search.
"""
import numpy as np
import pandas as pd
import logging
import json
import joblib
from pathlib import Path
from typing import Dict, Any, Optional, List, Tuple
from datetime import datetime

from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, ExtraTreesClassifier
from sklearn.pipeline import Pipeline
from sklearn.model_selection import (
    StratifiedKFold, cross_validate, RandomizedSearchCV
)
from sklearn.calibration import CalibratedClassifierCV
import xgboost as xgb

from preprocessing import build_preprocessor, NUMERICAL_FEATURES, CATEGORICAL_FEATURES

logging.basicConfig(level=logging.INFO, format='%(asctime)s — %(levelname)s — %(message)s')
logger = logging.getLogger(__name__)

MODELS_DIR = Path(__file__).parent.parent / 'models'
RANDOM_STATE = 42
CV_FOLDS = 5

# ─── Candidate Model Definitions ─────────────────────────────────────────────

def get_candidate_models(scale_numerics_map: Optional[Dict[str, bool]] = None) -> Dict[str, Pipeline]:
    """
    Returns dict of model_name -> sklearn Pipeline (preprocessor + classifier).
    scale_numerics_map: override per model whether to StandardScale numerics.
    """
    defaults = {
        'logistic_regression': True,
        'random_forest': False,
        'extra_trees': False,
        'xgboost': False,
    }
    if scale_numerics_map:
        defaults.update(scale_numerics_map)

    models = {}

    # Logistic Regression (needs scaling)
    models['logistic_regression'] = Pipeline([
        ('preprocessor', build_preprocessor(scale_numerics=defaults['logistic_regression'])),
        ('classifier', LogisticRegression(
            max_iter=1000,
            random_state=RANDOM_STATE,
            class_weight='balanced',
        )),
    ])

    # Random Forest
    models['random_forest'] = Pipeline([
        ('preprocessor', build_preprocessor(scale_numerics=defaults['random_forest'])),
        ('classifier', RandomForestClassifier(
            n_estimators=150,
            max_depth=16,
            random_state=RANDOM_STATE,
            n_jobs=-1,
            class_weight='balanced',
        )),
    ])

    # Extra Trees
    models['extra_trees'] = Pipeline([
        ('preprocessor', build_preprocessor(scale_numerics=defaults['extra_trees'])),
        ('classifier', ExtraTreesClassifier(
            n_estimators=150,
            max_depth=16,
            random_state=RANDOM_STATE,
            n_jobs=-1,
            class_weight='balanced',
        )),
    ])

    # XGBoost
    models['xgboost'] = Pipeline([
        ('preprocessor', build_preprocessor(scale_numerics=defaults['xgboost'])),
        ('classifier', xgb.XGBClassifier(
            n_estimators=200,
            learning_rate=0.08,
            max_depth=5,
            subsample=0.8,
            colsample_bytree=0.8,
            eval_metric='logloss',
            random_state=RANDOM_STATE,
            n_jobs=-1,
        )),
    ])

    return models


# ─── Hyperparameter Grids ─────────────────────────────────────────────────────

PARAM_GRIDS = {
    'logistic_regression': {
        'classifier__C': [0.001, 0.01, 0.1, 1.0, 10.0, 100.0],
        'classifier__penalty': ['l1', 'l2'],
        'classifier__solver': ['liblinear', 'saga'],
    },
    'random_forest': {
        'classifier__n_estimators': [100, 200, 300, 500],
        'classifier__max_depth': [None, 10, 20, 30],
        'classifier__min_samples_split': [2, 5, 10],
        'classifier__min_samples_leaf': [1, 2, 4],
        'classifier__max_features': ['sqrt', 'log2'],
    },
    'extra_trees': {
        'classifier__n_estimators': [100, 200, 300, 500],
        'classifier__max_depth': [None, 10, 20, 30],
        'classifier__max_features': ['sqrt', 'log2', 0.5],
        'classifier__min_samples_leaf': [1, 2, 4],
    },
    'xgboost': {
        'classifier__n_estimators': [100, 200, 300, 500],
        'classifier__max_depth': [3, 4, 5, 6, 8],
        'classifier__learning_rate': [0.01, 0.05, 0.1, 0.2],
        'classifier__subsample': [0.6, 0.7, 0.8, 0.9, 1.0],
        'classifier__colsample_bytree': [0.6, 0.7, 0.8, 0.9, 1.0],
        'classifier__reg_lambda': [0.1, 1.0, 5.0, 10.0],
    },
}

# ─── Cross-Validation ─────────────────────────────────────────────────────────

def cross_validate_model(
    pipeline: Pipeline,
    X_train: pd.DataFrame,
    y_train: pd.Series,
    n_folds: int = CV_FOLDS,
) -> Dict[str, float]:
    """Run stratified K-fold CV and return mean ± std of key metrics."""
    cv = StratifiedKFold(n_splits=n_folds, shuffle=True, random_state=RANDOM_STATE)

    scoring = ['accuracy', 'precision', 'recall', 'f1', 'roc_auc',
               'average_precision', 'neg_brier_score']

    scores = cross_validate(
        pipeline, X_train, y_train,
        cv=cv, scoring=scoring,
        return_train_score=False,
        n_jobs=-1,
    )

    result = {}
    for metric in scoring:
        key = f'test_{metric}'
        clean = metric.replace('neg_', '')
        vals = -scores[key] if metric.startswith('neg_') else scores[key]
        result[f'{clean}_mean'] = float(np.mean(vals))
        result[f'{clean}_std'] = float(np.std(vals))

    logger.info(f"CV Results: accuracy={result['accuracy_mean']:.4f}±{result['accuracy_std']:.4f} | "
                f"roc_auc={result['roc_auc_mean']:.4f}±{result['roc_auc_std']:.4f} | "
                f"f1={result['f1_mean']:.4f}±{result['f1_std']:.4f}")
    return result


# ─── Hyperparameter Search ────────────────────────────────────────────────────

def tune_hyperparameters(
    pipeline: Pipeline,
    param_grid: Dict,
    X_train: pd.DataFrame,
    y_train: pd.Series,
    n_iter: int = 20,
    scoring: str = 'roc_auc',
) -> Tuple[Pipeline, Dict]:
    """RandomizedSearchCV hyperparameter tuning. Uses training data only."""
    cv = StratifiedKFold(n_splits=CV_FOLDS, shuffle=True, random_state=RANDOM_STATE)

    search = RandomizedSearchCV(
        pipeline,
        param_distributions=param_grid,
        n_iter=n_iter,
        cv=cv,
        scoring=scoring,
        n_jobs=-1,
        random_state=RANDOM_STATE,
        verbose=1,
        refit=True,
    )
    search.fit(X_train, y_train)

    logger.info(f"Best {scoring}: {search.best_score_:.4f}")
    logger.info(f"Best params: {search.best_params_}")

    return search.best_estimator_, search.best_params_


# ─── Training Orchestration ───────────────────────────────────────────────────

def train_all_models(
    X_train: pd.DataFrame,
    y_train: pd.Series,
    run_cv: bool = True,
    models_to_train: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """
    Train all candidate models and optionally run cross-validation.
    Returns dict with fitted pipelines and CV results.
    """
    candidate_models = get_candidate_models()
    if models_to_train:
        candidate_models = {k: v for k, v in candidate_models.items() if k in models_to_train}

    results = {}
    for name, pipeline in candidate_models.items():
        logger.info(f"\n{'='*50}\nTraining: {name}\n{'='*50}")

        if run_cv:
            cv_results = cross_validate_model(pipeline, X_train, y_train)
        else:
            cv_results = {}

        # Fit on full training set
        pipeline.fit(X_train, y_train)

        results[name] = {
            'pipeline': pipeline,
            'cv_results': cv_results,
        }
        logger.info(f"Model '{name}' trained successfully")

    return results


# ─── Model Saving ─────────────────────────────────────────────────────────────

def save_model(
    pipeline: Pipeline,
    model_name: str,
    metadata: Optional[Dict] = None,
    threshold: float = 0.5,
) -> Path:
    """Serialize the fitted pipeline and write metadata JSON."""
    MODELS_DIR.mkdir(parents=True, exist_ok=True)

    model_path = MODELS_DIR / 'placement_model.joblib'
    joblib.dump(pipeline, model_path)
    logger.info(f"Model saved: {model_path}")

    meta = {
        'model_name': model_name,
        'model_path': str(model_path),
        'training_date': datetime.now().isoformat(),
        'classification_threshold': threshold,
        'features': NUMERICAL_FEATURES + CATEGORICAL_FEATURES,
        'target': 'placement_status',
        'random_state': RANDOM_STATE,
        'cv_folds': CV_FOLDS,
        **(metadata or {}),
    }
    meta_path = MODELS_DIR / 'model_metadata.json'
    with open(meta_path, 'w') as f:
        json.dump(meta, f, indent=2)
    logger.info(f"Metadata saved: {meta_path}")

    schema = {
        'numerical_features': NUMERICAL_FEATURES,
        'categorical_features': CATEGORICAL_FEATURES,
        'all_features': NUMERICAL_FEATURES + CATEGORICAL_FEATURES,
        'target': 'placement_status',
        'valid_branches': ['ECE', 'Chemical', 'EE', 'CE', 'CSE', 'IT', 'ME'],
        'valid_college_tiers': ['Tier-1', 'Tier-2', 'Tier-3'],
    }
    schema_path = MODELS_DIR / 'feature_schema.json'
    with open(schema_path, 'w') as f:
        json.dump(schema, f, indent=2)
    logger.info(f"Feature schema saved: {schema_path}")

    return model_path


if __name__ == '__main__':
    from preprocessing import run_preprocessing_pipeline

    result = run_preprocessing_pipeline(scale_numerics=False)
    X_train = result['X_train']
    y_train = result['y_train']

    training_results = train_all_models(X_train, y_train, run_cv=True)

    print("\n=== Cross-Validation Summary ===")
    for name, res in training_results.items():
        cv = res['cv_results']
        if cv:
            print(f"\n{name}:")
            print(f"  Accuracy : {cv.get('accuracy_mean', 0):.4f} ± {cv.get('accuracy_std', 0):.4f}")
            print(f"  ROC-AUC  : {cv.get('roc_auc_mean', 0):.4f} ± {cv.get('roc_auc_std', 0):.4f}")
            print(f"  F1       : {cv.get('f1_mean', 0):.4f} ± {cv.get('f1_std', 0):.4f}")
