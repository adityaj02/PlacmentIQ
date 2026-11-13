"""
PlacementIQ – FastAPI Application
Provides RESTful APIs for model inference, SHAP explainability,
skill-gap benchmarking, and what-if simulation.
"""
from datetime import datetime
import logging
from typing import Dict, Any

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from schemas import (
    PredictionRequest, PredictionResponse,
    BatchPredictionRequest, BatchPredictionResponse,
    ExplanationRequest, ExplanationResponse,
    SkillGapRequest, SkillGapResponse,
    SimulationRequest, SimulationResponse,
    HealthResponse, ModelInfoResponse
)
from model_service import model_service, SHAP_AVAILABLE

logging.basicConfig(level=logging.INFO, format='%(asctime)s — %(levelname)s — %(message)s')
logger = logging.getLogger("placementiq-api")

app = FastAPI(
    title="PlacementIQ API",
    description="Student Placement Prediction & Career-Readiness Analysis System",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins during development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health", response_model=HealthResponse, tags=["System"])
def health_check():
    """Verify backend health, model load status, and explainability subsystem."""
    return HealthResponse(
        status="healthy",
        model_loaded=(model_service.pipeline is not None),
        model_version=model_service.model_version,
        shap_available=SHAP_AVAILABLE,
        timestamp=datetime.now().isoformat()
    )


@app.get("/api/model-info", response_model=ModelInfoResponse, tags=["Model"])
def get_model_info():
    """Retrieve active model architecture metadata, schemas, and threshold configurations."""
    meta = model_service.metadata
    schema = model_service.schema

    return ModelInfoResponse(
        model_name=meta.get("model_name", "xgboost"),
        model_version=model_service.model_version,
        features=schema.get("all_features", []),
        numerical_features=schema.get("numerical_features", []),
        categorical_features=schema.get("categorical_features", []),
        default_threshold=model_service.default_threshold,
        f1_optimal_threshold=model_service.f1_optimal_threshold,
        test_metrics=meta.get("test_metrics", {}),
        training_date=meta.get("training_date", "")
    )


@app.post("/api/predict", response_model=PredictionResponse, tags=["Inference"])
def predict_placement(req: PredictionRequest):
    """
    Generate placement probability and classification for a student profile.
    Accepts an optional decision threshold (default: 0.50, F1-optimal: 0.35).
    """
    try:
        student_data = req.profile.model_dump()
        result = model_service.predict(student_data, threshold=req.decision_threshold)
        return PredictionResponse(**result)
    except Exception as e:
        logger.error(f"Prediction failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inference error: {str(e)}"
        )


@app.post("/api/batch-predict", response_model=BatchPredictionResponse, tags=["Inference"])
def batch_predict_placement(req: BatchPredictionRequest):
    """
    Generate placement predictions for a batch of student profiles in a single inference call.
    Ideal for Placement Cell batch evaluations and CSV uploads.
    """
    try:
        student_list = [p.model_dump() for p in req.students]
        result = model_service.batch_predict(student_list, threshold=req.decision_threshold)
        return BatchPredictionResponse(**result)
    except Exception as e:
        logger.error(f"Batch prediction failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Batch inference error: {str(e)}"
        )


@app.post("/api/explain", response_model=ExplanationResponse, tags=["Explainability"])
def explain_prediction(req: ExplanationRequest):
    """
    Generate individual SHAP feature attributions explaining how specific attributes
    drive the student's placement probability higher or lower.
    """
    if not SHAP_AVAILABLE or model_service.explainer is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="SHAP explainability subsystem is not loaded on this backend."
        )

    try:
        student_data = req.profile.model_dump()
        result = model_service.explain(student_data, top_n=req.top_n)
        return ExplanationResponse(**result)
    except Exception as e:
        logger.error(f"Explainability computation failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Explainability error: {str(e)}"
        )


@app.post("/api/skill-gap", response_model=SkillGapResponse, tags=["Analytics"])
def analyze_skill_gap(req: SkillGapRequest):
    """
    Compare a student's profile against cohort benchmarks and generate actionable advice.
    """
    try:
        student_data = req.profile.model_dump()
        result = model_service.analyze_skill_gaps(student_data)
        return SkillGapResponse(**result)
    except Exception as e:
        logger.error(f"Skill-gap analysis failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Skill-gap analysis error: {str(e)}"
        )


@app.post("/api/simulate", response_model=SimulationResponse, tags=["Simulation"])
def simulate_profile_change(req: SimulationRequest):
    """
    Simulate what-if scenarios by modifying selected profile features and observing probability delta.
    """
    try:
        original_data = req.original.model_dump()
        result = model_service.simulate(
            original_dict=original_data,
            modifications=req.modifications,
            threshold=req.decision_threshold
        )
        return SimulationResponse(**result)
    except Exception as e:
        logger.error(f"Simulation failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Simulation error: {str(e)}"
        )


from pathlib import Path
from fastapi.staticfiles import StaticFiles

# If frontend production build exists, serve it
FRONTEND_DIST = Path(__file__).parent.parent / "frontend" / "dist"
if FRONTEND_DIST.exists():
    app.mount("/", StaticFiles(directory=str(FRONTEND_DIST), html=True), name="frontend")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
