\# Loan Default Risk Prediction with AI Credit Assessment



A production-grade machine learning system that predicts loan default risk and generates AI-powered credit assessments for fintech lending decisions.



\## Live Demo



\- \*\*Frontend:\*\* https://loan-default-prediction-pc5ki565n-cvds-hubs-projects.vercel.app

\- \*\*API:\*\* https://loan-default-api-g5zo.onrender.com

\- \*\*API Docs:\*\* https://loan-default-api-g5zo.onrender.com/docs



\## Project Overview



This capstone project builds an end-to-end data science pipeline for a fintech lender, addressing the business problem of identifying loan applicants likely to default before approval.



\### Key Features



\- Binary classification model predicting loan default probability

\- LightGBM model tuned with Optuna achieving ROC-AUC of 0.7526

\- SHAP explainability for global and individual predictions

\- AI-generated credit risk summaries via Groq (Llama 3)

\- Real-time web interface with risk visualisations

\- FastAPI backend deployed on Render

\- Next.js frontend deployed on Vercel



\## Dataset



Home Credit Default Risk — Kaggle  

307,511 loan applications across 7 interrelated tables  

Target: Binary classification (default / no default) — 8.07% default rate



\## Project Structure

├── notebooks/          # Jupyter notebooks (EDA, modelling, explainability)

├── src/                # Production code

│   ├── main.py         # FastAPI backend

│   ├── pipeline.py     # ETL and prediction pipeline

│   ├── preprocessor.pkl

│   └── model\_tuned\_lightgbm.pkl

├── frontend/           # Next.js web interface

├── reports/            # Charts, SHAP plots, insights summary

├── tests/              # Unit tests

├── requirements.txt    # Python dependencies

└── Dockerfile          # Container configuration



\## Model Performance



| Model | ROC-AUC | F1-Score | Recall |

|---|---|---|---|

| Logistic Regression (baseline) | 0.7378 | 0.2566 | 0.6778 |

| XGBoost | 0.7423 | 0.2847 | 0.5304 |

| LightGBM | 0.7398 | 0.2870 | 0.5948 |

| LightGBM (Optuna tuned) | \*\*0.7526\*\* | 0.2733 | 0.6691 |



\## Setup Instructions



\### Prerequisites

\- Python 3.10+

\- Node.js 18+



\### Backend



```bash

pip install -r requirements.txt

cd src

uvicorn main:app --reload --port 8000

```



\### Frontend



```bash

cd frontend

npm install

npm run dev

```



\### Environment Variables



GROQ\_API\_KEY= gsk\_CvepyN5FOdLF6mAruHm7WGdyb3FYVodvw0otVQXL5vbzOKJmlliB



NEXT\_PUBLIC\_API\_URL=http://127.0.0.1:8000



\## Architecture



User → Next.js Frontend → FastAPI Backend → LightGBM Model → SHAP → Groq AI → Response



\## Tech Stack



\*\*Data Science:\*\* Python, Pandas, Scikit-learn, LightGBM, XGBoost, SHAP, Optuna  

\*\*Backend:\*\* FastAPI, Uvicorn  

\*\*Frontend:\*\* Next.js, Tailwind CSS, Recharts  

\*\*AI:\*\* Groq API (Llama 3.1)  

\*\*Deployment:\*\* Vercel (frontend), Render (backend)




