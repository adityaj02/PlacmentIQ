"""
PlacementIQ – Preprocessing Module
Handles data loading, validation, cleaning, feature engineering,
encoding, scaling, and train/test splitting.
All transformations are leakage-safe (fitted on training data only).
"""

import pandas as pd
import numpy as np
import logging
from pathlib import Path
from typing import Tuple, Dict, Any, Optional
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
import joblib

logging.basicConfig(level=logging.INFO, format='%(asctime)s — %(levelname)s — %(message)s')
logger = logging.getLogger(__name__)

# ─── Constants ──────────────────────────────────────────────────────────────
RAW_DATA_PATH = Path(__file__).parent.parent / 'data' / 'raw' / 'student_placement_synthetic.csv'
PROCESSED_DATA_DIR = Path(__file__).parent.parent / 'data' / 'processed'
MODELS_DIR = Path(__file__).parent.parent / 'models'

TARGET_COLUMN = 'placement_status'
EXCLUDE_COLUMNS = ['salary_package_lpa']  # target-leakage column

CATEGORICAL_FEATURES = ['branch', 'college_tier']
NUMERICAL_FEATURES = [
    'cgpa', 'backlogs', 'coding_skills', 'dsa_score', 'aptitude_score',
    'communication_skills', 'ml_knowledge', 'system_design', 'internships',
    'projects_count', 'certifications', 'hackathons', 'open_source_contributions',
    'extracurriculars'
]
ALL_FEATURES = CATEGORICAL_FEATURES + NUMERICAL_FEATURES

VALID_BRANCHES = {'ECE', 'Chemical', 'EE', 'CE', 'CSE', 'IT', 'ME'}
VALID_TIERS = {'Tier-1', 'Tier-2', 'Tier-3'}

RANDOM_STATE = 42
TEST_SIZE = 0.20

# ─── Data Loading & Validation ───────────────────────────────────────────────

def load_dataset(filepath: Optional[Path] = None) -> pd.DataFrame:
    """Load the raw CSV dataset with schema validation."""
    path = filepath or RAW_DATA_PATH
    logger.info(f"Loading dataset from {path}")

    if not Path(path).exists():
        raise FileNotFoundError(f"Dataset not found at: {path}")

    df = pd.read_csv(path)
    logger.info(f"Loaded dataset: {df.shape[0]} rows × {df.shape[1]} columns")
    return df


def validate_schema(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Validate dataset schema, missing values, duplicates, and ranges.
    Returns a validation report dict. Raises ValueError for critical failures.
    """
    report = {}

    # Check required columns
    required_cols = ALL_FEATURES + [TARGET_COLUMN]
    missing_cols = [c for c in required_cols if c not in df.columns]
    if missing_cols:
        raise ValueError(f"Missing required columns: {missing_cols}")
    report['columns_ok'] = True

    # Dimensions
    report['shape'] = df.shape

    # Missing values (excluding the excluded col)
    missing_in_features = df[ALL_FEATURES + [TARGET_COLUMN]].isnull().sum()
    report['missing_values'] = missing_in_features[missing_in_features > 0].to_dict()

    # Duplicates
    dup_count = df.duplicated().sum()
    report['duplicate_rows'] = int(dup_count)
    if dup_count > 0:
        logger.warning(f"Found {dup_count} duplicate rows — will be removed")

    # Target validation
    target_vals = set(df[TARGET_COLUMN].unique())
    if not target_vals.issubset({0, 1}):
        raise ValueError(f"Target column contains unexpected values: {target_vals}")
    report['target_distribution'] = df[TARGET_COLUMN].value_counts().to_dict()

    # Categorical validation
    invalid_branches = set(df['branch'].unique()) - VALID_BRANCHES
    invalid_tiers = set(df['college_tier'].unique()) - VALID_TIERS
    if invalid_branches:
        logger.warning(f"Unexpected branch values: {invalid_branches}")
    if invalid_tiers:
        logger.warning(f"Unexpected college_tier values: {invalid_tiers}")
    report['invalid_categories'] = {'branch': list(invalid_branches), 'college_tier': list(invalid_tiers)}

    # Range checks for numerical features
    range_issues = {}
    range_checks = {
        'cgpa': (0.0, 10.0),
        'backlogs': (0, 10),
        'coding_skills': (0.0, 10.0),
        'dsa_score': (0.0, 10.0),
        'aptitude_score': (0.0, 100.0),
        'communication_skills': (0.0, 10.0),
        'ml_knowledge': (0.0, 10.0),
        'system_design': (0.0, 10.0),
        'internships': (0, 20),
        'projects_count': (0, 50),
        'certifications': (0, 50),
        'hackathons': (0, 20),
        'open_source_contributions': (0, 20),
        'extracurriculars': (0, 20),
    }
    for col, (lo, hi) in range_checks.items():
        if col in df.columns:
            out = df[(df[col] < lo) | (df[col] > hi)]
            if len(out):
                range_issues[col] = int(len(out))
                logger.warning(f"Range issue in '{col}': {len(out)} rows outside [{lo}, {hi}]")
    report['range_issues'] = range_issues

    logger.info("Schema validation complete")
    return report


# ─── Data Cleaning ────────────────────────────────────────────────────────────

def clean_dataset(df: pd.DataFrame) -> pd.DataFrame:
    """Remove duplicates and exclude leakage/irrelevant columns."""
    before = len(df)
    df = df.drop_duplicates()
    after = len(df)
    if before != after:
        logger.info(f"Removed {before - after} duplicate rows")

    # Drop excluded columns that exist
    cols_to_drop = [c for c in EXCLUDE_COLUMNS if c in df.columns]
    if cols_to_drop:
        df = df.drop(columns=cols_to_drop)
        logger.info(f"Dropped excluded columns: {cols_to_drop}")

    return df.reset_index(drop=True)


# ─── Feature Engineering ──────────────────────────────────────────────────────

def engineer_features(df: pd.DataFrame, include_engineered: bool = False) -> pd.DataFrame:
    """
    Optionally add derived composite indicators.
    Set include_engineered=True to add:
      - academic_performance_index: weighted combo of cgpa & backlogs
      - technical_readiness_index:  avg of coding, dsa, ml, system_design
      - practical_experience_index: internships + projects + open_source
    These are EXPERIMENTAL — baseline model uses original 16 features only.
    """
    if not include_engineered:
        return df

    df = df.copy()
    df['academic_performance_index'] = (
        df['cgpa'] / 10.0 - df['backlogs'] * 0.1
    ).clip(0, 1)

    df['technical_readiness_index'] = (
        df[['coding_skills', 'dsa_score', 'ml_knowledge', 'system_design']].mean(axis=1) / 10.0
    )

    df['practical_experience_index'] = (
        df['internships'] * 2 + df['projects_count'] + df['open_source_contributions']
    )

    logger.info("Engineered features added: academic_performance_index, technical_readiness_index, practical_experience_index")
    return df


# ─── Train/Test Split ─────────────────────────────────────────────────────────

def split_data(
    df: pd.DataFrame,
    test_size: float = TEST_SIZE,
    random_state: int = RANDOM_STATE
) -> Tuple[pd.DataFrame, pd.DataFrame, pd.Series, pd.Series]:
    """Stratified 80/20 train-test split."""
    X = df[ALL_FEATURES]
    y = df[TARGET_COLUMN]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y,
        test_size=test_size,
        random_state=random_state,
        stratify=y
    )

    logger.info(f"Train: {len(X_train)} rows | Test: {len(X_test)} rows")
    logger.info(f"Train target dist: {y_train.value_counts().to_dict()}")
    logger.info(f"Test  target dist: {y_test.value_counts().to_dict()}")

    return X_train, X_test, y_train, y_test


# ─── Preprocessing Pipeline ───────────────────────────────────────────────────

def build_preprocessor(scale_numerics: bool = True) -> ColumnTransformer:
    """
    Build a ColumnTransformer for the 16 input features.

    Numerical pipeline:
      - SimpleImputer (median strategy)
      - StandardScaler (optional, skip for tree-based models)

    Categorical pipeline:
      - SimpleImputer (most_frequent strategy)
      - OneHotEncoder (handle_unknown='ignore', sparse_output=False)

    Args:
        scale_numerics: If False, skip StandardScaler (for tree-based models).

    Returns:
        ColumnTransformer fitted to training data externally.
    """
    if scale_numerics:
        numeric_pipeline = Pipeline([
            ('imputer', SimpleImputer(strategy='median')),
            ('scaler', StandardScaler()),
        ])
    else:
        numeric_pipeline = Pipeline([
            ('imputer', SimpleImputer(strategy='median')),
        ])

    categorical_pipeline = Pipeline([
        ('imputer', SimpleImputer(strategy='most_frequent')),
        ('encoder', OneHotEncoder(handle_unknown='ignore', sparse_output=False)),
    ])

    preprocessor = ColumnTransformer(
        transformers=[
            ('num', numeric_pipeline, NUMERICAL_FEATURES),
            ('cat', categorical_pipeline, CATEGORICAL_FEATURES),
        ],
        remainder='drop',
        verbose_feature_names_out=False,
    )

    return preprocessor


def get_feature_names_after_transform(preprocessor: ColumnTransformer) -> list:
    """Extract final feature names after ColumnTransformer fit."""
    num_names = NUMERICAL_FEATURES.copy()
    cat_encoder = preprocessor.named_transformers_['cat'].named_steps['encoder']
    cat_names = list(cat_encoder.get_feature_names_out(CATEGORICAL_FEATURES))
    return num_names + cat_names


# ─── Save / Load Helpers ──────────────────────────────────────────────────────

def save_processed_splits(X_train, X_test, y_train, y_test) -> None:
    """Persist processed train/test splits as CSV for reproducibility."""
    PROCESSED_DATA_DIR.mkdir(parents=True, exist_ok=True)
    X_train.to_csv(PROCESSED_DATA_DIR / 'X_train.csv', index=False)
    X_test.to_csv(PROCESSED_DATA_DIR / 'X_test.csv', index=False)
    y_train.to_csv(PROCESSED_DATA_DIR / 'y_train.csv', index=False)
    y_test.to_csv(PROCESSED_DATA_DIR / 'y_test.csv', index=False)
    logger.info(f"Splits saved to {PROCESSED_DATA_DIR}")


def save_preprocessor(preprocessor: ColumnTransformer, path: Optional[Path] = None) -> None:
    """Serialize the fitted preprocessor."""
    out = path or MODELS_DIR / 'preprocessor.joblib'
    out.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(preprocessor, out)
    logger.info(f"Preprocessor saved: {out}")


def load_preprocessor(path: Optional[Path] = None) -> ColumnTransformer:
    """Deserialize the fitted preprocessor."""
    p = path or MODELS_DIR / 'preprocessor.joblib'
    if not Path(p).exists():
        raise FileNotFoundError(f"Preprocessor not found at: {p}")
    return joblib.load(p)


# ─── Full Pipeline Entry Point ────────────────────────────────────────────────

def run_preprocessing_pipeline(
    filepath: Optional[Path] = None,
    scale_numerics: bool = False,
    include_engineered: bool = False,
    save_splits: bool = True,
) -> Dict[str, Any]:
    """
    End-to-end preprocessing:
      load → validate → clean → (optionally engineer) → split → build preprocessor

    Returns:
        dict with keys: X_train, X_test, y_train, y_test,
                        preprocessor, validation_report, feature_names
    """
    # 1. Load
    df = load_dataset(filepath)

    # 2. Validate
    validation_report = validate_schema(df)
    logger.info(f"Validation report: {validation_report}")

    # 3. Clean
    df = clean_dataset(df)

    # 4. Optionally engineer features
    df = engineer_features(df, include_engineered=include_engineered)

    # 5. Split
    X_train, X_test, y_train, y_test = split_data(df)

    # 6. Build & fit preprocessor on TRAIN only
    preprocessor = build_preprocessor(scale_numerics=scale_numerics)
    preprocessor.fit(X_train)
    logger.info("Preprocessor fitted on training data only")

    feature_names = get_feature_names_after_transform(preprocessor)
    logger.info(f"Transformed feature count: {len(feature_names)}")

    if save_splits:
        save_processed_splits(X_train, X_test, y_train, y_test)
        save_preprocessor(preprocessor)

    return {
        'X_train': X_train,
        'X_test': X_test,
        'y_train': y_train,
        'y_test': y_test,
        'preprocessor': preprocessor,
        'validation_report': validation_report,
        'feature_names': feature_names,
    }


if __name__ == '__main__':
    result = run_preprocessing_pipeline(scale_numerics=False)
    print("\n=== Preprocessing Complete ===")
    print(f"Train shape : {result['X_train'].shape}")
    print(f"Test  shape : {result['X_test'].shape}")
    print(f"Features    : {len(result['feature_names'])}")
    print(f"Feat names  : {result['feature_names']}")
