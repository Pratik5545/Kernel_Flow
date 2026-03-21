from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Literal
import uvicorn
from predictor import TaskPredictor

app = FastAPI(
    title="KernelFlow AI Prediction Service",
    description="Microservice for predicting task execution time using ML heuristics",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5000",
        "http://localhost:5173",
        "https://kernel-flow-1.onrender.com",
        "https://kernel-flow-nu.vercel.app",
    ],
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],  # Allow all headers for API calls
)

predictor = TaskPredictor()

class TaskInput(BaseModel):
    task_id: str = Field(..., description="Unique task identifier")
    task_type: Literal["CPU", "IO", "MEMORY", "NETWORK", "GPU"] = Field(..., description="Type of task")
    priority: int = Field(..., ge=1, le=5, description="Priority level 1 (low) to 5 (critical)")
    complexity: float = Field(default=1.0, ge=0.1, le=10.0, description="Complexity factor")

class PredictionResponse(BaseModel):
    task_id: str
    estimated_time_seconds: float
    confidence_score: float
    complexity_label: str
    model_version: str

@app.get("/")
def root():
    return {"service": "KernelFlow AI Predictor", "status": "online", "version": "1.0.0"}

@app.get("/health")
def health():
    return {"status": "healthy"}

@app.post("/predict", response_model=PredictionResponse)
def predict_task_time(task: TaskInput):
    try:
        result = predictor.predict(
            task_type=task.task_type,
            priority=task.priority,
            complexity=task.complexity
        )
        return PredictionResponse(
            task_id=task.task_id,
            estimated_time_seconds=result["estimated_time"],
            confidence_score=result["confidence"],
            complexity_label=result["complexity_label"],
            model_version="heuristic-v1.2"
        )
    except Exception as e:
        # Security: Log error server-side, return generic message
        import logging
        logging.error(f"Prediction error for task {task.task_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Prediction service error. Please try again later.")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
