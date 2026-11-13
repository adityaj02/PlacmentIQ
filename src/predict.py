"""
PlacementIQ – Prediction & Skill-Gap & What-If Module
Handles single-student inference, skill-gap analysis, and what-if simulation.
"""
import numpy as np
import pandas as pd
import logging
import joblib
from pathlib import Path
from typing import Dict, Any, Optional

MODELS_DIR = Path(__file__).parent.parent / 'models'
logging.basicConfig(level=logging.INFO, format='%(asctime)s — %(levelname)s — %(message)s')
logger = logging.getLogger(__name__)

# ─── Benchmarks (computed from placed students in the dataset) ─────────────────
# These will be overridden at runtime by computing from actual training data.
# Fallback defaults reflect approximate dataset medians for placed students.
PLACED_BENCHMARKS = {
    'cgpa': 7.5,
    'backlogs': 0,
    'coding_skills': 6.5,
    'dsa_score': 6.0,
    'aptitude_score': 68.0,
    'communication_skills': 6.5,
    'ml_knowledge': 5.0,
    'system_design': 4.5,
    'internships': 1,
    'projects_count': 3,
    'certifications': 2,
    'hackathons': 1,
    'open_source_contributions': 1,
    'extracurriculars': 1,
}

SKILL_GAP_THRESHOLDS = {
    'cgpa': 7.0,
    'backlogs': 1,
    'coding_skills': 6.0,
    'dsa_score': 5.5,
    'aptitude_score': 60.0,
    'communication_skills': 6.0,
    'ml_knowledge': 4.0,
    'system_design': 3.5,
    'internships': 1,
    'projects_count': 2,
    'certifications': 1,
    'hackathons': 1,
    'open_source_contributions': 0,
    'extracurriculars': 1,
}

RECOMMENDATIONS = {
    'cgpa': 'Focus on improving academic performance; aim for CGPA ≥ 7.0',
    'backlogs': 'Clear any pending backlogs to improve your profile strength',
    'coding_skills': 'Practice competitive programming on platforms like LeetCode, Codeforces',
    'dsa_score': 'Study data structures and algorithms — arrays, trees, graphs, dynamic programming',
    'aptitude_score': 'Practice quantitative aptitude and logical reasoning daily',
    'communication_skills': 'Improve technical communication and interview soft skills',
    'ml_knowledge': 'Complete a structured ML course (Andrew Ng / fast.ai) and work on projects',
    'system_design': 'Study software architecture and system design fundamentals',
    'internships': 'Apply for internship opportunities — even short-term or virtual ones',
    'projects_count': 'Build and document practical projects; deploy on GitHub',
    'certifications': 'Earn relevant certifications (AWS, Google, Coursera specializations)',
    'hackathons': 'Participate in hackathons on Devfolio, MLH, or domain-specific contests',
    'open_source_contributions': 'Contribute to open-source projects on GitHub',
    'extracurriculars': 'Participate in technical clubs, events, or leadership activities',
}


# ─── Load Model ───────────────────────────────────────────────────────────────

def load_model(model_path: Optional[Path] = None):
    """Load the serialized placement prediction pipeline."""
    path = model_path or (MODELS_DIR / 'placement_model.joblib')
    if not Path(path).exists():
        raise FileNotFoundError(f"Model not found at: {path}")
    pipeline = joblib.load(path)
    logger.info(f"Model loaded from {path}")
    return pipeline


# ─── Prediction ───────────────────────────────────────────────────────────────

def predict_placement(
    pipeline,
    student_data: Dict[str, Any],
    threshold: float = 0.5,
) -> Dict[str, Any]:
    """
    Generate placement prediction for a single student.
    student_data: dict with keys matching ALL_FEATURES.
    Returns dict with class, probability, and confidence label.
    """
    df = pd.DataFrame([student_data])
    prob = float(pipeline.predict_proba(df)[0, 1])
    pred_class = int(prob >= threshold)

    if prob >= 0.75:
        confidence = 'High'
    elif prob >= 0.55:
        confidence = 'Moderate'
    else:
        confidence = 'Low'

    return {
        'predicted_class': pred_class,
        'placement_probability': round(prob, 4),
        'placement_label': 'Placed' if pred_class == 1 else 'Not Placed',
        'confidence': confidence,
        'threshold_used': threshold,
        'disclaimer': (
            'This is a model-estimated probability based on a synthetic training dataset. '
            'It does not guarantee actual placement outcomes.'
        ),
    }


# ─── Skill-Gap Analysis ───────────────────────────────────────────────────────

def compute_skill_gaps(
    student_data: Dict[str, Any],
    benchmarks: Optional[Dict[str, float]] = None,
) -> Dict[str, Any]:
    """
    Compare student profile against benchmarks.
    Returns identified gaps and recommendations.
    """
    bench = benchmarks or SKILL_GAP_THRESHOLDS
    gaps = []

    for skill, threshold_val in bench.items():
        student_val = student_data.get(skill)
        if student_val is None:
            continue

        # For backlogs, higher is worse
        if skill == 'backlogs':
            gap_exists = student_val > threshold_val
            gap_magnitude = max(0, student_val - threshold_val)
        else:
            gap_exists = student_val < threshold_val
            gap_magnitude = max(0, threshold_val - student_val)

        if gap_exists:
            gaps.append({
                'skill': skill,
                'student_value': student_val,
                'benchmark': threshold_val,
                'gap': round(gap_magnitude, 2),
                'recommendation': RECOMMENDATIONS.get(skill, 'Focus on improving this area.'),
            })

    gaps.sort(key=lambda x: x['gap'], reverse=True)

    return {
        'total_gaps_identified': len(gaps),
        'gaps': gaps,
        'benchmark_source': 'Placement-group threshold based on training data distribution',
        'disclaimer': (
            'Skill-gap recommendations are advisory. '
            'Meeting these thresholds does not guarantee placement.'
        ),
    }


# ─── What-If Simulation ───────────────────────────────────────────────────────

def simulate_what_if(
    pipeline,
    original_data: Dict[str, Any],
    modifications: Dict[str, Any],
    threshold: float = 0.5,
) -> Dict[str, Any]:
    """
    Compare placement probability for original vs modified student profile.
    modifications: dict with the same keys as original_data to override.
    """
    # Validate that only known feature keys are modified
    modified_data = {**original_data, **modifications}

    orig_result = predict_placement(pipeline, original_data, threshold)
    mod_result = predict_placement(pipeline, modified_data, threshold)

    orig_prob = orig_result['placement_probability']
    mod_prob = mod_result['placement_probability']
    diff = round(mod_prob - orig_prob, 4)

    comparison = []
    for key, orig_val in original_data.items():
        mod_val = modified_data.get(key)
        if orig_val != mod_val:
            comparison.append({
                'feature': key,
                'original': orig_val,
                'modified': mod_val,
            })

    return {
        'original': {
            'probability': orig_prob,
            'label': orig_result['placement_label'],
        },
        'modified': {
            'probability': mod_prob,
            'label': mod_result['placement_label'],
        },
        'probability_change': diff,
        'probability_change_pct': round(diff * 100, 2),
        'direction': 'improvement' if diff > 0 else ('decline' if diff < 0 else 'no_change'),
        'feature_changes': comparison,
        'disclaimer': (
            'This simulation shows model sensitivity to input changes. '
            'It does not imply that modifying these attributes will causally produce the shown outcome.'
        ),
    }
