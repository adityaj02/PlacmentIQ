"""
PlacementIQ – SHAP Explainability Module
Provides global (summary/importance) and local (individual)
SHAP explanations for the trained classification pipeline.
"""
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import logging
try:
    import shap
    SHAP_AVAILABLE = True
except ImportError:
    shap = None
    SHAP_AVAILABLE = False
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple
from sklearn.pipeline import Pipeline

logging.basicConfig(level=logging.INFO, format='%(asctime)s — %(levelname)s — %(message)s')
logger = logging.getLogger(__name__)

FIGURES_DIR = Path(__file__).parent.parent / 'reports' / 'figures'


def _get_transformed_data_and_names(
    pipeline: Pipeline,
    X: pd.DataFrame,
) -> Tuple[np.ndarray, List[str]]:
    """
    Extract the fitted preprocessor from the pipeline,
    transform X, and return (X_transformed, feature_names).
    Works for pipelines where step[0] is named 'preprocessor'.
    """
    preprocessor = pipeline.named_steps['preprocessor']
    X_transformed = preprocessor.transform(X)

    # Build feature names
    num_names = list(preprocessor.transformers_[0][2])  # numerical passthrough names
    cat_encoder = preprocessor.named_transformers_['cat'].named_steps['encoder']
    cat_names = list(cat_encoder.get_feature_names_out(
        preprocessor.transformers_[1][2]  # categorical input cols
    ))
    feature_names = num_names + cat_names
    return X_transformed, feature_names


def build_shap_explainer(
    pipeline: Pipeline,
    X_background: pd.DataFrame,
    n_background: int = 200,
):
    """
    Build a SHAP explainer for the final classifier in the pipeline.
    Uses TreeExplainer for tree-based models, KernelExplainer as fallback.
    Background sample is taken from X_background (training data subset).
    """
    if not SHAP_AVAILABLE:
        raise ImportError("SHAP is not installed. Run 'pip install shap' to enable explainability.")
    classifier = pipeline.named_steps['classifier']
    X_bg_transformed, _ = _get_transformed_data_and_names(pipeline, X_background)

    # Sample background for efficiency
    if len(X_bg_transformed) > n_background:
        idx = np.random.choice(len(X_bg_transformed), n_background, replace=False)
        X_bg_sample = X_bg_transformed[idx]
    else:
        X_bg_sample = X_bg_transformed

    model_type = type(classifier).__name__
    logger.info(f"Building SHAP explainer for: {model_type}")

    try:
        explainer = shap.TreeExplainer(classifier)
        logger.info("Using TreeExplainer")
    except Exception:
        logger.warning("TreeExplainer failed — falling back to KernelExplainer")
        explainer = shap.KernelExplainer(
            classifier.predict_proba,
            X_bg_sample,
        )

    return explainer


def compute_shap_values(
    explainer: Any,
    pipeline: Pipeline,
    X: pd.DataFrame,
) -> Tuple[np.ndarray, List[str]]:
    """
    Compute SHAP values for X.
    Returns (shap_values_for_class_1, feature_names).
    """
    if not SHAP_AVAILABLE:
        raise ImportError("SHAP is not installed. Run 'pip install shap' to enable explainability.")
    X_transformed, feature_names = _get_transformed_data_and_names(pipeline, X)
    raw = explainer(X_transformed)

    # Handle both old-style (array) and new-style (Explanation) outputs
    if hasattr(shap, 'Explanation') and isinstance(raw, shap.Explanation):
        shap_vals = raw.values
    else:
        shap_vals = raw

    # For binary classification: use class=1 SHAP values
    if shap_vals.ndim == 3:
        shap_vals = shap_vals[:, :, 1]

    logger.info(f"SHAP values computed: shape {shap_vals.shape}")
    return shap_vals, feature_names


def plot_shap_summary(
    shap_values: np.ndarray,
    X_transformed: np.ndarray,
    feature_names: List[str],
    model_name: str = 'model',
    save: bool = True,
) -> None:
    """Generate and save a SHAP beeswarm (summary) plot."""
    fig, ax = plt.subplots(figsize=(10, 8))
    shap.summary_plot(
        shap_values, X_transformed,
        feature_names=feature_names,
        show=False,
        plot_type='dot',
    )
    plt.title(f'SHAP Summary (Beeswarm) — {model_name}', fontsize=13, fontweight='bold', pad=12)
    plt.tight_layout()

    if save:
        FIGURES_DIR.mkdir(parents=True, exist_ok=True)
        path = FIGURES_DIR / f'shap_summary_{model_name.replace(" ", "_")}.png'
        plt.savefig(path, dpi=150, bbox_inches='tight')
        logger.info(f"Saved SHAP summary plot: {path}")
    plt.close()


def plot_shap_importance(
    shap_values: np.ndarray,
    feature_names: List[str],
    model_name: str = 'model',
    top_n: int = 15,
    save: bool = True,
) -> pd.DataFrame:
    """Bar chart of mean absolute SHAP values (global importance). Returns importance df."""
    mean_abs = np.abs(shap_values).mean(axis=0)
    importance_df = pd.DataFrame({
        'feature': feature_names,
        'mean_abs_shap': mean_abs,
    }).sort_values('mean_abs_shap', ascending=False).head(top_n).reset_index(drop=True)

    fig, ax = plt.subplots(figsize=(9, 6))
    ax.barh(importance_df['feature'][::-1], importance_df['mean_abs_shap'][::-1],
            color='steelblue', edgecolor='white')
    ax.set_xlabel('Mean |SHAP Value|', fontsize=12)
    ax.set_title(f'Global Feature Importance (SHAP) — {model_name}', fontsize=13, fontweight='bold')
    plt.tight_layout()

    if save:
        FIGURES_DIR.mkdir(parents=True, exist_ok=True)
        path = FIGURES_DIR / f'shap_importance_{model_name.replace(" ", "_")}.png'
        fig.savefig(path, dpi=150, bbox_inches='tight')
        logger.info(f"Saved SHAP importance plot: {path}")
    plt.close(fig)

    return importance_df


def explain_individual(
    pipeline: Pipeline,
    explainer: Any,
    X_single: pd.DataFrame,
    feature_names: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """
    Explain one student's prediction.
    Returns dict with probability, shap values per feature, and sorted contributions.
    """
    if not SHAP_AVAILABLE:
        raise ImportError("SHAP is not installed. Run 'pip install shap' to enable explainability.")
    X_transformed, feat_names = _get_transformed_data_and_names(pipeline, X_single)
    if feature_names is None:
        feature_names = feat_names

    prob = float(pipeline.predict_proba(X_single)[0, 1])
    pred_class = int(prob >= 0.5)

    raw = explainer(X_transformed)
    if isinstance(raw, shap.Explanation):
        shap_vals = raw.values[0]
    else:
        shap_vals = raw[0] if raw.ndim == 2 else raw[0, :, 1]

    if shap_vals.ndim == 2:
        shap_vals = shap_vals[:, 1]

    contributions = [
        {
            'feature': feat,
            'shap_value': float(sv),
            'direction': 'positive' if sv > 0 else 'negative',
        }
        for feat, sv in zip(feature_names, shap_vals)
    ]
    contributions.sort(key=lambda x: abs(x['shap_value']), reverse=True)

    return {
        'placement_probability': prob,
        'predicted_class': pred_class,
        'feature_contributions': contributions,
    }
