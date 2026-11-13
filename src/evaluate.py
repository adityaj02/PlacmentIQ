"""
PlacementIQ – Model Evaluation Module
Computes classification metrics, confusion matrix, ROC/PR curves,
calibration analysis, and model comparison table.
"""
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib
matplotlib.use('Agg')
import seaborn as sns
import logging
from pathlib import Path
from typing import Dict, Any, Optional, Tuple
import json

from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, average_precision_score, brier_score_loss,
    confusion_matrix, classification_report,
    RocCurveDisplay, PrecisionRecallDisplay,
)
from sklearn.calibration import calibration_curve, CalibrationDisplay
from sklearn.pipeline import Pipeline

logging.basicConfig(level=logging.INFO, format='%(asctime)s — %(levelname)s — %(message)s')
logger = logging.getLogger(__name__)

REPORTS_DIR = Path(__file__).parent.parent / 'reports'
FIGURES_DIR = REPORTS_DIR / 'figures'


def evaluate_model(
    pipeline: Pipeline,
    X_test: pd.DataFrame,
    y_test: pd.Series,
    model_name: str = 'model',
    threshold: float = 0.5,
) -> Dict[str, Any]:
    """
    Full evaluation: probabilities, predictions, and all metrics.
    Returns dict with metrics and predictions.
    """
    y_proba = pipeline.predict_proba(X_test)[:, 1]
    y_pred = (y_proba >= threshold).astype(int)

    metrics = compute_metrics(y_test, y_pred, y_proba, model_name)
    cm = confusion_matrix(y_test, y_pred)

    logger.info(f"[{model_name}] Accuracy={metrics['accuracy']:.4f} | "
                f"ROC-AUC={metrics['roc_auc']:.4f} | "
                f"F1={metrics['f1']:.4f} | "
                f"PR-AUC={metrics['pr_auc']:.4f}")

    return {
        'metrics': metrics,
        'confusion_matrix': cm,
        'y_proba': y_proba,
        'y_pred': y_pred,
        'threshold': threshold,
    }


def compute_metrics(
    y_true: pd.Series,
    y_pred: np.ndarray,
    y_proba: np.ndarray,
    model_name: str = 'model',
) -> Dict[str, float]:
    """Compute all classification metrics."""
    return {
        'model_name': model_name,
        'accuracy': float(accuracy_score(y_true, y_pred)),
        'precision': float(precision_score(y_true, y_pred, zero_division=0)),
        'recall': float(recall_score(y_true, y_pred, zero_division=0)),
        'f1': float(f1_score(y_true, y_pred, zero_division=0)),
        'roc_auc': float(roc_auc_score(y_true, y_proba)),
        'pr_auc': float(average_precision_score(y_true, y_proba)),
        'brier_score': float(brier_score_loss(y_true, y_proba)),
    }


def plot_confusion_matrix(cm: np.ndarray, model_name: str, save: bool = True) -> None:
    """Plot and optionally save a confusion matrix heatmap."""
    fig, ax = plt.subplots(figsize=(6, 5))
    labels = ['Not Placed (0)', 'Placed (1)']
    sns.heatmap(
        cm, annot=True, fmt='d', cmap='Blues',
        xticklabels=labels, yticklabels=labels, ax=ax,
        linewidths=0.5,
    )
    ax.set_xlabel('Predicted Label', fontsize=12)
    ax.set_ylabel('True Label', fontsize=12)
    ax.set_title(f'Confusion Matrix — {model_name}', fontsize=13, fontweight='bold')
    plt.tight_layout()

    if save:
        FIGURES_DIR.mkdir(parents=True, exist_ok=True)
        path = FIGURES_DIR / f'confusion_matrix_{model_name.replace(" ", "_")}.png'
        fig.savefig(path, dpi=150, bbox_inches='tight')
        logger.info(f"Saved confusion matrix: {path}")
    plt.close(fig)


def plot_roc_curve(
    pipeline: Pipeline,
    X_test: pd.DataFrame,
    y_test: pd.Series,
    model_name: str,
    save: bool = True,
) -> None:
    """Plot ROC curve."""
    fig, ax = plt.subplots(figsize=(7, 5))
    RocCurveDisplay.from_estimator(pipeline, X_test, y_test, ax=ax, name=model_name)
    ax.plot([0, 1], [0, 1], 'k--', label='Random Classifier')
    ax.set_title(f'ROC Curve — {model_name}', fontsize=13, fontweight='bold')
    ax.legend()
    plt.tight_layout()

    if save:
        FIGURES_DIR.mkdir(parents=True, exist_ok=True)
        path = FIGURES_DIR / f'roc_curve_{model_name.replace(" ", "_")}.png'
        fig.savefig(path, dpi=150, bbox_inches='tight')
        logger.info(f"Saved ROC curve: {path}")
    plt.close(fig)


def plot_pr_curve(
    pipeline: Pipeline,
    X_test: pd.DataFrame,
    y_test: pd.Series,
    model_name: str,
    save: bool = True,
) -> None:
    """Plot Precision-Recall curve."""
    fig, ax = plt.subplots(figsize=(7, 5))
    PrecisionRecallDisplay.from_estimator(pipeline, X_test, y_test, ax=ax, name=model_name)
    ax.set_title(f'Precision-Recall Curve — {model_name}', fontsize=13, fontweight='bold')
    plt.tight_layout()

    if save:
        FIGURES_DIR.mkdir(parents=True, exist_ok=True)
        path = FIGURES_DIR / f'pr_curve_{model_name.replace(" ", "_")}.png'
        fig.savefig(path, dpi=150, bbox_inches='tight')
        logger.info(f"Saved PR curve: {path}")
    plt.close(fig)


def plot_calibration_curve(
    pipeline: Pipeline,
    X_test: pd.DataFrame,
    y_test: pd.Series,
    model_name: str,
    n_bins: int = 10,
    save: bool = True,
) -> None:
    """Plot probability calibration curve."""
    y_proba = pipeline.predict_proba(X_test)[:, 1]
    fraction_of_positives, mean_predicted = calibration_curve(
        y_test, y_proba, n_bins=n_bins, strategy='uniform'
    )

    fig, ax = plt.subplots(figsize=(7, 5))
    ax.plot([0, 1], [0, 1], 'k--', label='Perfectly Calibrated')
    ax.plot(mean_predicted, fraction_of_positives, 's-', label=model_name)
    ax.set_xlabel('Mean Predicted Probability', fontsize=12)
    ax.set_ylabel('Fraction of Positives', fontsize=12)
    ax.set_title(f'Calibration Curve — {model_name}', fontsize=13, fontweight='bold')
    ax.legend()
    plt.tight_layout()

    if save:
        FIGURES_DIR.mkdir(parents=True, exist_ok=True)
        path = FIGURES_DIR / f'calibration_{model_name.replace(" ", "_")}.png'
        fig.savefig(path, dpi=150, bbox_inches='tight')
        logger.info(f"Saved calibration curve: {path}")
    plt.close(fig)


def build_comparison_table(all_results: Dict[str, Dict]) -> pd.DataFrame:
    """Build a model comparison DataFrame from evaluation results."""
    rows = []
    for model_name, res in all_results.items():
        m = res['metrics']
        rows.append({
            'Model': model_name,
            'Accuracy': round(m['accuracy'], 4),
            'Precision': round(m['precision'], 4),
            'Recall': round(m['recall'], 4),
            'F1': round(m['f1'], 4),
            'ROC-AUC': round(m['roc_auc'], 4),
            'PR-AUC': round(m['pr_auc'], 4),
            'Brier Score': round(m['brier_score'], 4),
        })
    df = pd.DataFrame(rows).sort_values('ROC-AUC', ascending=False).reset_index(drop=True)
    return df


def find_optimal_threshold(
    y_true: pd.Series,
    y_proba: np.ndarray,
    metric: str = 'f1',
    thresholds: Optional[np.ndarray] = None,
) -> Tuple[float, float]:
    """Find the classification threshold that maximises the given metric on validation data."""
    if thresholds is None:
        thresholds = np.arange(0.1, 0.91, 0.01)

    best_thresh, best_score = 0.5, 0.0
    for t in thresholds:
        y_pred = (y_proba >= t).astype(int)
        if metric == 'f1':
            score = f1_score(y_true, y_pred, zero_division=0)
        elif metric == 'accuracy':
            score = accuracy_score(y_true, y_pred)
        else:
            score = f1_score(y_true, y_pred, zero_division=0)

        if score > best_score:
            best_score = score
            best_thresh = t

    logger.info(f"Optimal threshold ({metric}): {best_thresh:.2f} → score: {best_score:.4f}")
    return float(best_thresh), float(best_score)


def save_evaluation_report(
    comparison_df: pd.DataFrame,
    output_path: Optional[Path] = None,
) -> None:
    """Save model comparison as JSON."""
    path = output_path or (REPORTS_DIR / 'evaluation_report.json')
    path.parent.mkdir(parents=True, exist_ok=True)
    comparison_df.to_json(path, orient='records', indent=2)
    logger.info(f"Evaluation report saved: {path}")
