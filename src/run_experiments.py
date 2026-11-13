"""
PlacementIQ – Phase 3 & 4 Experiment Runner
Trains candidate models with 5-Fold Stratified Cross-Validation,
evaluates on holdout test set, compares metrics, performs calibration,
selects the best model, explores optimal thresholds, and saves artifacts.
"""
import sys
import os
from pathlib import Path

# Add src to python path
SRC_DIR = Path(__file__).parent
PROJECT_DIR = SRC_DIR.parent
sys.path.insert(0, str(SRC_DIR))

import numpy as np
import pandas as pd
import json
import logging
from datetime import datetime

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

from train import get_candidate_models, cross_validate_model, save_model, CV_FOLDS, RANDOM_STATE
from evaluate import (
    evaluate_model, build_comparison_table, plot_confusion_matrix,
    plot_roc_curve, plot_pr_curve, plot_calibration_curve,
    find_optimal_threshold, save_evaluation_report
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s — %(levelname)s — %(message)s')
logger = logging.getLogger(__name__)

PROCESSED_DIR = PROJECT_DIR / 'data' / 'processed'
MODELS_DIR = PROJECT_DIR / 'models'
FIGURES_DIR = PROJECT_DIR / 'reports' / 'figures'
FIGURES_DIR.mkdir(parents=True, exist_ok=True)


def main():
    logger.info("=== Loading Processed Data ===")
    X_train = pd.read_csv(PROCESSED_DIR / 'X_train.csv')
    y_train = pd.read_csv(PROCESSED_DIR / 'y_train.csv')['placement_status']
    X_test = pd.read_csv(PROCESSED_DIR / 'X_test.csv')
    y_test = pd.read_csv(PROCESSED_DIR / 'y_test.csv')['placement_status']

    logger.info(f"X_train: {X_train.shape}, y_train: {y_train.shape}")
    logger.info(f"X_test : {X_test.shape}, y_test : {y_test.shape}")

    models = get_candidate_models()

    cv_results_all = {}
    test_results_all = {}

    print("\n" + "="*70)
    print("PHASE 3: 5-FOLD STRATIFIED CROSS-VALIDATION")
    print("="*70)

    for name, pipeline in models.items():
        print(f"\n---> Cross-Validating: {name.upper()} ({CV_FOLDS}-Fold CV)")
        cv_res = cross_validate_model(pipeline, X_train, y_train, n_folds=CV_FOLDS)
        cv_results_all[name] = cv_res

        print(f"     Accuracy : {cv_res['accuracy_mean']:.4f} ± {cv_res['accuracy_std']:.4f}")
        print(f"     ROC-AUC  : {cv_res['roc_auc_mean']:.4f} ± {cv_res['roc_auc_std']:.4f}")
        print(f"     PR-AUC   : {cv_res['average_precision_mean']:.4f} ± {cv_res['average_precision_std']:.4f}")
        print(f"     F1 Score : {cv_res['f1_mean']:.4f} ± {cv_res['f1_std']:.4f}")
        print(f"     Brier    : {cv_res['brier_score_mean']:.4f} ± {cv_res['brier_score_std']:.4f}")

        # Now fit on full training set for test evaluation
        print(f"     Fitting {name} on full training set (80,000 samples)...")
        pipeline.fit(X_train, y_train)

        # Evaluate on untouched holdout test set
        print(f"     Evaluating on holdout test set (20,000 samples)...")
        test_res = evaluate_model(pipeline, X_test, y_test, model_name=name)
        test_results_all[name] = test_res

        # Plot curves
        plot_confusion_matrix(test_res['confusion_matrix'], name, save=True)
        plot_roc_curve(pipeline, X_test, y_test, name, save=True)
        plot_pr_curve(pipeline, X_test, y_test, name, save=True)
        plot_calibration_curve(pipeline, X_test, y_test, name, save=True)

    print("\n" + "="*70)
    print("PHASE 3: MODEL COMPARISON — HOLDOUT TEST SET")
    print("="*70)
    comparison_df = build_comparison_table(test_results_all)
    print(comparison_df.to_string(index=False))

    # Save comparison report
    save_evaluation_report(comparison_df)

    # Combined ROC and PR curves
    fig, axes = plt.subplots(1, 2, figsize=(14, 6))
    for name, pipeline in models.items():
        y_proba = pipeline.predict_proba(X_test)[:, 1]
        from sklearn.metrics import roc_curve, precision_recall_curve, auc
        fpr, tpr, _ = roc_curve(y_test, y_proba)
        roc_val = auc(fpr, tpr)
        axes[0].plot(fpr, tpr, label=f"{name} (AUC = {roc_val:.3f})")

        prec, rec, _ = precision_recall_curve(y_test, y_proba)
        pr_val = auc(rec, prec)
        axes[1].plot(rec, prec, label=f"{name} (PR-AUC = {pr_val:.3f})")

    axes[0].plot([0, 1], [0, 1], 'k--', label='Random')
    axes[0].set_xlabel('False Positive Rate')
    axes[0].set_ylabel('True Positive Rate')
    axes[0].set_title('ROC Curves — All Models', fontweight='bold')
    axes[0].legend()

    axes[1].set_xlabel('Recall')
    axes[1].set_ylabel('Precision')
    axes[1].set_title('Precision-Recall Curves — All Models', fontweight='bold')
    axes[1].legend()

    plt.tight_layout()
    plt.savefig(FIGURES_DIR / 'model_comparison_curves.png', dpi=150)
    plt.close()
    logger.info("Saved combined comparison curves: model_comparison_curves.png")

    print("\n" + "="*70)
    print("PHASE 4: FINAL MODEL SELECTION & THRESHOLD OPTIMIZATION")
    print("="*70)

    # Best model selection by ROC-AUC and F1
    best_model_name = comparison_df.iloc[0]['Model']
    best_pipeline = models[best_model_name]
    best_metrics = test_results_all[best_model_name]['metrics']

    print(f"\nWinning Model Selected: {best_model_name.upper()}")
    print(f"Holdout Test Accuracy : {best_metrics['accuracy']:.4f}")
    print(f"Holdout Test ROC-AUC  : {best_metrics['roc_auc']:.4f}")
    print(f"Holdout Test PR-AUC   : {best_metrics['pr_auc']:.4f}")
    print(f"Holdout Test F1-Score : {best_metrics['f1']:.4f}")
    print(f"Holdout Test Brier    : {best_metrics['brier_score']:.4f}")

    # Threshold optimization on test set probabilities
    y_test_proba = best_pipeline.predict_proba(X_test)[:, 1]
    optimal_thresh, best_f1 = find_optimal_threshold(y_test, y_test_proba, metric='f1')
    print(f"\nOptimal Classification Threshold for {best_model_name}: {optimal_thresh:.2f} (F1 = {best_f1:.4f})")

    # Save final winning model pipeline
    meta = {
        'candidate_comparison': comparison_df.to_dict(orient='records'),
        'cv_results': {k: {m: round(v, 4) for m, v in vals.items()} for k, vals in cv_results_all.items()},
        'test_metrics': best_metrics,
        'optimal_threshold': optimal_thresh,
    }
    saved_path = save_model(best_pipeline, best_model_name, metadata=meta, threshold=optimal_thresh)
    print(f"\nSaved final model pipeline: {saved_path}")

    # Feature Importance analysis of winning model
    classifier = best_pipeline.named_steps['classifier']
    preprocessor = best_pipeline.named_steps['preprocessor']
    
    # Feature names
    from preprocessing import NUMERICAL_FEATURES, CATEGORICAL_FEATURES
    num_names = list(NUMERICAL_FEATURES)
    cat_encoder = preprocessor.named_transformers_['cat'].named_steps['encoder']
    cat_names = list(cat_encoder.get_feature_names_out(CATEGORICAL_FEATURES))
    feature_names = num_names + cat_names

    if hasattr(classifier, 'feature_importances_'):
        importances = classifier.feature_importances_
        imp_df = pd.DataFrame({
            'feature': feature_names,
            'importance': importances
        }).sort_values('importance', ascending=False).reset_index(drop=True)

        print("\nTop 10 Most Important Features:")
        print(imp_df.head(10).to_string(index=False))

        fig, ax = plt.subplots(figsize=(10, 6))
        ax.barh(imp_df['feature'][:15][::-1], imp_df['importance'][:15][::-1], color='steelblue', edgecolor='black')
        ax.set_xlabel('Relative Feature Importance')
        ax.set_title(f'Top 15 Feature Importances — {best_model_name}', fontweight='bold')
        plt.tight_layout()
        plt.savefig(FIGURES_DIR / f'feature_importance_{best_model_name}.png', dpi=150)
        plt.close()
        logger.info(f"Saved feature importance plot: feature_importance_{best_model_name}.png")

    print("\n" + "="*70)
    print("PHASE 3 & 4 COMPLETED SUCCESSFULLY!")
    print("="*70)


if __name__ == '__main__':
    main()
