from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import pandas as pd
import numpy as np
import joblib
import sys
import os
import re
import warnings

warnings.filterwarnings("ignore")

# Add src to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import pipeline

from groq import Groq
import shap

app = FastAPI(title="Loan Default Risk API")

# Allow requests from frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load models and explainer once at startup
model = pipeline.model
preprocessor = pipeline.preprocessor
shap_explainer = joblib.load(
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "shap_explainer.pkl")
)
groq_client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

# Input schema — key fields a loan officer would enter
class ApplicantInput(BaseModel):
    AMT_INCOME_TOTAL: float
    AMT_CREDIT: float
    AMT_ANNUITY: float
    DAYS_BIRTH: int
    DAYS_EMPLOYED: int
    EXT_SOURCE_1: Optional[float] = None
    EXT_SOURCE_2: Optional[float] = None
    EXT_SOURCE_3: Optional[float] = None
    NAME_CONTRACT_TYPE: str = "Cash loans"
    CODE_GENDER: str = "M"
    NAME_INCOME_TYPE: str = "Working"
    NAME_EDUCATION_TYPE: str = "Secondary / secondary special"
    NAME_FAMILY_STATUS: str = "Single / not married"
    NAME_HOUSING_TYPE: str = "House / apartment"
    CNT_CHILDREN: int = 0
    CNT_FAM_MEMBERS: float = 1.0
    OWN_CAR_AGE: Optional[float] = None
    OCCUPATION_TYPE: Optional[str] = None

def get_shap_factors(applicant_df, n_top=3):
    """Get top risk and mitigating factors for an applicant."""
    X = pipeline.preprocess(applicant_df)
    shap_vals = shap_explainer.shap_values(X)
    if isinstance(shap_vals, list):
        shap_vals = shap_vals[1]

    shap_df = pd.DataFrame({
        "feature": X.columns,
        "shap_value": shap_vals[0]
    }).sort_values("shap_value", ascending=False)

    risk_factors = shap_df[shap_df["shap_value"] > 0].head(n_top)
    mitigating_factors = shap_df[shap_df["shap_value"] < 0].tail(n_top)

    return risk_factors, mitigating_factors

def generate_summary(prob, risk_tier, recommendation, risk_factors, mitigating_factors):
    """Generate AI credit summary using Groq."""
    risk_text = "\n".join([
        f"- {row['feature'].replace('_', ' ')}: contribution = {row['shap_value']:.3f}"
        for _, row in risk_factors.iterrows()
    ])
    mitigating_text = "\n".join([
        f"- {row['feature'].replace('_', ' ')}: contribution = {row['shap_value']:.3f}"
        for _, row in mitigating_factors.iterrows()
    ])

    prompt = f"""You are a senior credit analyst at a fintech lending company.

APPLICANT ASSESSMENT:
- Predicted default probability: {prob:.2%}
- Risk tier: {risk_tier}
- Recommendation: {recommendation}

TOP RISK FACTORS:
{risk_text}

MITIGATING FACTORS:
{mitigating_text}

Write a professional credit risk summary of no more than 200 words.
State the risk tier and recommendation in the first sentence.
Explain the top 3 risk factors in plain English without technical jargon.
Acknowledge the mitigating factors.
End with a clear lending recommendation and next steps."""

    response = groq_client.chat.completions.create(
        model="llama-3.1-8b-instant",
        max_tokens=400,
        temperature=0.7,
        messages=[
            {"role": "system", "content": "You are a senior credit analyst."},
            {"role": "user", "content": prompt}
        ]
    )
    return response.choices[0].message.content

@app.get("/")
def root():
    return {"status": "Loan Default Risk API is running"}

@app.post("/predict")
def predict(applicant: ApplicantInput):
    """Main prediction endpoint."""
    # Convert input to DataFrame with all required columns
    # Fill missing columns with NaN - pipeline handles imputation
    input_dict = applicant.dict()

    # Create a template row with all expected columns set to NaN
    template = pd.read_csv(
        os.path.join(os.path.dirname(os.path.abspath(__file__)), 
        "../data/application_train.csv"), nrows=1
    )
    template = template.drop(columns=["TARGET"], errors="ignore")
    template_row = template.iloc[0:1].copy()

    # Override with provided values
    for key, value in input_dict.items():
        if key in template_row.columns:
            template_row[key] = value

    # Run prediction
    results = pipeline.predict(template_row)
    result = results[0]

    # Get SHAP factors
    risk_factors, mitigating_factors = get_shap_factors(template_row)

    # Generate AI summary
    summary = generate_summary(
        result["probability"],
        result["risk_tier"],
        result["recommendation"],
        risk_factors,
        mitigating_factors
    )

    return {
        "probability": result["probability"],
        "risk_tier": result["risk_tier"],
        "recommendation": result["recommendation"],
        "summary": summary,
        "top_risk_factors": risk_factors["feature"].tolist(),
        "top_mitigating_factors": mitigating_factors["feature"].tolist()
    }
