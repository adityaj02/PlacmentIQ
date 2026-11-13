# PlacementIQ

> **AI-powered student placement prediction platform** — predicts campus placement outcomes and package estimates using machine learning on academic, skill, and extracurricular features.

---

## Table of Contents

- [Description](#description)
- [Tech Stack](#tech-stack)
- [Folder Structure](#folder-structure)
- [Dataset](#dataset)
- [Model Pipeline](#model-pipeline)
- [Setup Instructions](#setup-instructions)
- [Running the Application](#running-the-application)
- [Limitations](#limitations)
- [License](#license)

---

## Description

PlacementIQ is an end-to-end machine learning system that ingests student profiles and predicts:

1. **Placement Status** — binary classification (Placed / Not Placed)
2. **Expected Package** — regression estimate for placed students (in LPA)

The platform exposes predictions via a FastAPI REST backend and a React frontend dashboard, with SHAP-based explainability to surface the most influential features for each individual prediction.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Data Processing | Python, Pandas, NumPy, SciPy |
| Machine Learning | scikit-learn, XGBoost, imbalanced-learn |
| Explainability | SHAP |
| Visualisation | Matplotlib, Seaborn, Plotly |
| Model Persistence | Joblib |
| Backend API | FastAPI, Uvicorn, Pydantic |
| Database | MongoDB (via PyMongo) |
| Frontend | React (npm) |
| Notebook Environment | Jupyter Notebook, ipykernel |
| Configuration | python-dotenv |

---

## Folder Structure

```
PlacementIQ/
├── data/
│   ├── raw/                        # Original, immutable source data
│   │   └── student_placement_synthetic.csv
│   ├── processed/                  # Cleaned & feature-engineered datasets
│   └── external/                   # Any third-party supplementary data
├── notebooks/
│   ├── 01_data_exploration.ipynb   # EDA and statistical summaries
│   ├── 02_data_preprocessing.ipynb # Cleaning, encoding, scaling
│   ├── 03_feature_engineering.ipynb# Feature creation and selection
│   ├── 04_model_training.ipynb     # Model training, tuning, evaluation
│   └── 05_model_explainability.ipynb # SHAP analysis and visualisations
├── src/
│   ├── __init__.py
│   ├── data_loader.py              # Dataset I/O utilities
│   ├── preprocessing.py            # Preprocessing pipeline
│   ├── feature_engineering.py      # Feature transformations
│   ├── model.py                    # Model training & evaluation logic
│   └── explainability.py           # SHAP wrapper utilities
├── models/
│   ├── placement_model.joblib      # Serialised trained model
│   ├── model_metadata.json         # Metrics, params, training date
│   └── feature_schema.json         # Expected feature names and types
├── backend/
│   ├── __init__.py
│   ├── main.py                     # FastAPI app entry point
│   ├── routers/                    # API route modules
│   ├── schemas.py                  # Pydantic request/response models
│   ├── services.py                 # Prediction & DB service logic
│   └── database.py                 # MongoDB connection setup
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/             # Reusable React components
│   │   ├── pages/                  # Page-level views
│   │   └── App.jsx
│   ├── package.json
│   └── vite.config.js
├── reports/
│   └── figures/                    # Generated charts and plots
├── .env.example                    # Environment variable template
├── requirements.txt                # Python dependencies
└── README.md
```

---

## Dataset

| Property | Detail |
|---|---|
| File | `data/raw/student_placement_synthetic.csv` |
| Rows | ~100,000 synthetic student records |
| Columns | 18 |
| Target | `placement_status` (Placed / Not Placed) |

**Feature overview:**

| Feature | Type | Description |
|---|---|---|
| `student_id` | ID | Unique student identifier |
| `age` | Numeric | Student age |
| `gender` | Categorical | Gender |
| `stream` | Categorical | Undergraduate stream/branch |
| `cgpa` | Numeric | Cumulative GPA (10-point scale) |
| `backlogs` | Numeric | Number of active backlogs |
| `internships` | Numeric | Number of internships completed |
| `projects` | Numeric | Number of projects completed |
| `certifications` | Numeric | Number of certifications obtained |
| `aptitude_score` | Numeric | Aptitude test score (0–100) |
| `communication_score` | Numeric | Communication skill rating (0–10) |
| `technical_score` | Numeric | Technical skill rating (0–100) |
| `soft_skills_score` | Numeric | Soft skills rating (0–10) |
| `extracurriculars` | Numeric | Extracurricular activity count |
| `placement_training` | Binary | Attended placement training (0/1) |
| `mock_interviews` | Numeric | Number of mock interviews attended |
| `placement_status` | Target | Placed / Not Placed |
| `package_lpa` | Numeric | Offered package in LPA (NaN if not placed) |

---

## Model Pipeline

```
Raw CSV → Cleaning → Encoding → Scaling → SMOTE (class balance)
       → XGBoost Classifier (placement_status)
       → XGBoost Regressor  (package_lpa | placed)
       → SHAP explainability layer
       → Joblib serialisation → FastAPI serving
```

Key steps:
1. **Preprocessing** — handle missing values, encode categoricals, scale numerics
2. **Class balancing** — SMOTE oversampling for minority class
3. **Model selection** — XGBoost with cross-validated hyperparameter tuning
4. **Evaluation** — Accuracy, ROC-AUC, F1, Precision, Recall; MAE/RMSE for regression
5. **Explainability** — SHAP summary plots, waterfall charts, force plots per prediction

---

## Setup Instructions

### 1. Clone & navigate

```bash
git clone <repo-url>
cd PlacementIQ
```

### 2. Create a virtual environment

```bash
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS / Linux
source .venv/bin/activate
```

### 3. Install Python dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure environment variables

```bash
copy .env.example .env       # Windows
# or
cp .env.example .env         # macOS / Linux
```

Edit `.env` with your actual MongoDB URI and paths as needed.

### 5. Ensure MongoDB is running

```bash
# Default: mongodb://localhost:27017
mongod
```

---

## Running the Application

### Notebooks (run in order)

Launch Jupyter and execute notebooks sequentially:

```bash
jupyter notebook
```

| Order | Notebook | Purpose |
|---|---|---|
| 01 | `01_data_exploration.ipynb` | EDA, distributions, correlations |
| 02 | `02_data_preprocessing.ipynb` | Cleaning, encoding, train/test split |
| 03 | `03_feature_engineering.ipynb` | Feature creation and selection |
| 04 | `04_model_training.ipynb` | Train, tune, evaluate, save model |
| 05 | `05_model_explainability.ipynb` | SHAP analysis and report figures |

### Backend API

```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

API docs available at: `http://localhost:8000/docs`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend available at: `http://localhost:5173`

---

## Limitations

> [!WARNING]
> **Synthetic Data Disclaimer** — This project uses a synthetically generated dataset of ~100,000 student records. The data does **not** represent real students or institutions and was created solely for demonstration and development purposes.

- Predictions made by this system **must not** be used for actual placement decisions without validation on real institutional data.
- Model performance metrics reflect synthetic patterns; real-world accuracy may differ significantly.
- The dataset may not capture all socioeconomic, regional, or institutional factors that influence placement outcomes.
- Fairness and bias audits should be conducted before any production deployment on real data.

---

## License

This project is licensed under the **MIT License**.

```
MIT License

Copyright (c) 2026 EduMatrix

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
