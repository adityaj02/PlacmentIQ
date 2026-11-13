"""
PlacementIQ – Pydantic Schemas for Request & Response Validation
Enforces strict range validation for all 16 student features and typed API contracts.
"""
from typing import Optional, List, Dict, Any, Literal
from pydantic import BaseModel, Field, field_validator


BranchType = Literal['ECE', 'Chemical', 'EE', 'CE', 'CSE', 'IT', 'ME']
CollegeTierType = Literal['Tier-1', 'Tier-2', 'Tier-3']


class StudentProfile(BaseModel):
    name: Optional[str] = Field("Student", description="Student's full name")
    uid: Optional[str] = Field("", description="Student UID / Roll Number")
    branch: BranchType = Field(..., description="Student's academic engineering branch")
    college_tier: CollegeTierType = Field(..., description="College tier categorization (Tier-1, Tier-2, Tier-3)")
    cgpa: float = Field(..., ge=0.0, le=10.0, description="Cumulative Grade Point Average (0.0 - 10.0)")
    backlogs: int = Field(0, ge=0, le=10, description="Number of active/historical academic backlogs")
    coding_skills: float = Field(..., ge=0.0, le=10.0, description="Coding assessment score (0.0 - 10.0)")
    dsa_score: float = Field(..., ge=0.0, le=10.0, description="Data Structures & Algorithms score (0.0 - 10.0)")
    aptitude_score: float = Field(..., ge=0.0, le=100.0, description="Aptitude test score (0.0 - 100.0)")
    communication_skills: float = Field(..., ge=0.0, le=10.0, description="Communication proficiency rating (0.0 - 10.0)")
    ml_knowledge: float = Field(..., ge=0.0, le=10.0, description="Machine learning proficiency (0.0 - 10.0)")
    system_design: float = Field(..., ge=0.0, le=10.0, description="System design proficiency (0.0 - 10.0)")
    internships: int = Field(0, ge=0, le=20, description="Number of completed internships")
    projects_count: int = Field(..., ge=0, le=50, description="Number of practical academic/industry projects")
    certifications: int = Field(0, ge=0, le=50, description="Number of professional certifications earned")
    hackathons: int = Field(0, ge=0, le=20, description="Number of hackathons participated in")
    open_source_contributions: int = Field(0, ge=0, le=20, description="Count of open-source repository contributions")
    extracurriculars: int = Field(0, ge=0, le=20, description="Extracurricular participation rating/count")

    model_config = {
        "json_schema_extra": {
            "example": {
                "name": "Aditya Sharma",
                "uid": "21BCS10101",
                "branch": "CSE",
                "college_tier": "Tier-2",
                "cgpa": 7.85,
                "backlogs": 0,
                "coding_skills": 7.5,
                "dsa_score": 7.0,
                "aptitude_score": 74.5,
                "communication_skills": 6.8,
                "ml_knowledge": 5.5,
                "system_design": 4.5,
                "internships": 1,
                "projects_count": 3,
                "certifications": 2,
                "hackathons": 1,
                "open_source_contributions": 1,
                "extracurriculars": 1
            }
        }
    }


class PredictionRequest(BaseModel):
    profile: StudentProfile
    decision_threshold: Optional[float] = Field(
        0.50,
        ge=0.05,
        le=0.95,
        description="Configurable decision threshold (default: 0.50; F1-optimal: 0.35)"
    )


class PredictionResponse(BaseModel):
    name: Optional[str] = Field(None, description="Student Name")
    uid: Optional[str] = Field(None, description="Student UID")
    predicted_status: int = Field(..., description="0 = Not Placed, 1 = Placed")
    placement_label: str = Field(..., description="'Placed' or 'Not Placed'")
    placement_probability: float = Field(..., description="Continuous model-estimated probability (0.0 - 1.0)")
    decision_threshold: float = Field(..., description="Operating decision threshold applied")
    confidence: str = Field(..., description="'High', 'Moderate', or 'Low'")
    model_version: str = Field("placement-xgb-v1", description="Active model identifier")
    disclaimer: str = Field(
        "Placement Cell evaluation based on trained institutional student performance data.",
        description="Mandatory advisory disclaimer"
    )


class BatchPredictionRequest(BaseModel):
    students: List[StudentProfile]
    decision_threshold: Optional[float] = 0.50


class BatchPredictionResponse(BaseModel):
    total_evaluated: int
    placed_count: int
    not_placed_count: int
    placement_rate: float
    results: List[PredictionResponse]


class FeatureContribution(BaseModel):
    feature: str
    shap_value: float
    direction: Literal['positive', 'negative']
    feature_value: Any


class ExplanationRequest(BaseModel):
    profile: StudentProfile
    top_n: Optional[int] = Field(15, ge=3, le=24, description="Number of top influential features to return")


class ExplanationResponse(BaseModel):
    placement_probability: float
    predicted_status: int
    decision_threshold: float
    base_value: float
    contributions: List[FeatureContribution]
    model_version: str
    disclaimer: str


class SkillGapRequest(BaseModel):
    profile: StudentProfile


class SkillGapItem(BaseModel):
    skill: str
    student_value: Any
    benchmark: float
    gap: float
    recommendation: str


class SkillGapResponse(BaseModel):
    total_gaps_identified: int
    readiness_score: float
    gaps: List[SkillGapItem]
    benchmarks_used: Dict[str, float]
    disclaimer: str


class SimulationRequest(BaseModel):
    original: StudentProfile
    modifications: Dict[str, Any]
    decision_threshold: Optional[float] = 0.50


class FeatureChange(BaseModel):
    feature: str
    original: Any
    modified: Any


class SimulationResponse(BaseModel):
    original_probability: float
    original_status: int
    modified_probability: float
    modified_status: int
    probability_change_pct: float
    direction: Literal['improvement', 'decline', 'no_change']
    decision_threshold: float
    feature_changes: List[FeatureChange]
    disclaimer: str


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    model_version: str
    shap_available: bool
    timestamp: str


class ModelInfoResponse(BaseModel):
    model_name: str
    model_version: str
    features: List[str]
    numerical_features: List[str]
    categorical_features: List[str]
    default_threshold: float
    f1_optimal_threshold: float
    test_metrics: Dict[str, Any]
    training_date: str
