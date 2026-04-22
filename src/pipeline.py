import pandas as pd
import numpy as np
import joblib
import re
import os
import warnings

warnings.filterwarnings("ignore")

# Load preprocessor and model once at startup
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
preprocessor = joblib.load(os.path.join(BASE_DIR, "preprocessor.pkl"))
model = joblib.load(os.path.join(BASE_DIR, "model_tuned_lightgbm.pkl"))

# Columns to drop - same as feature engineering notebook
COLS_TO_DROP = [
    "FONDKAPREMONT_MODE", "COMMONAREA_AVG", "COMMONAREA_MODE",
    "COMMONAREA_MEDI", "NONLIVINGAPARTMENTS_AVG", "NONLIVINGAPARTMENTS_MODE",
    "NONLIVINGAPARTMENTS_MEDI", "LIVINGAPARTMENTS_AVG", "LIVINGAPARTMENTS_MODE",
    "LIVINGAPARTMENTS_MEDI", "FLOORSMIN_AVG", "FLOORSMIN_MODE",
    "FLOORSMIN_MEDI", "YEARS_BUILD_AVG", "YEARS_BUILD_MODE",
    "YEARS_BUILD_MEDI", "AMT_GOODS_PRICE", "CNT_FAM_MEMBERS"
]

def clean_column_names(df):
    df.columns = [re.sub(r"[^A-Za-z0-9_]", "_", str(col)) for col in df.columns]
    return df

def engineer_features(df):
    """Apply all feature engineering steps to raw applicant data."""

    # Fix DAYS_EMPLOYED anomaly
    df["DAYS_EMPLOYED_ANOMALY"] = (df["DAYS_EMPLOYED"] == 365243).astype(int)
    df["DAYS_EMPLOYED"] = df["DAYS_EMPLOYED"].replace(365243, np.nan)

    # Age and employment in years
    df["AGE_YEARS"] = abs(df["DAYS_BIRTH"]) / 365
    df["EMPLOYMENT_YEARS"] = abs(df["DAYS_EMPLOYED"]) / 365

    # External source composite scores
    ext_cols = ["EXT_SOURCE_1", "EXT_SOURCE_2", "EXT_SOURCE_3"]
    df["EXT_SOURCE_MEAN"] = df[ext_cols].mean(axis=1)
    df["EXT_SOURCE_MIN"] = df[ext_cols].min(axis=1)

    # Car ownership flag
    df["HAS_CAR"] = df["OWN_CAR_AGE"].notnull().astype(int)

    # Financial ratios
    df["CREDIT_INCOME_RATIO"] = df["AMT_CREDIT"] / df["AMT_INCOME_TOTAL"]
    df["ANNUITY_INCOME_RATIO"] = df["AMT_ANNUITY"] / df["AMT_INCOME_TOTAL"]
    df["LOAN_TERM"] = df["AMT_CREDIT"] / df["AMT_ANNUITY"]
    df["INCOME_PER_PERSON"] = df["AMT_INCOME_TOTAL"] / df["CNT_FAM_MEMBERS"]

    # Winsorise financial features
    caps = {
        "AMT_INCOME_TOTAL": 472500,
        "AMT_CREDIT": 1854000,
        "AMT_ANNUITY": 70006,
    }
    for col, cap in caps.items():
        if col in df.columns:
            df[col] = df[col].clip(upper=cap)

    # Drop high missingness and redundant columns
    cols_to_drop = [c for c in COLS_TO_DROP if c in df.columns]
    df = df.drop(columns=cols_to_drop)

    # Drop identifier columns if present
    for col in ["SK_ID_CURR", "TARGET"]:
        if col in df.columns:
            df = df.drop(columns=[col])

    return df

def get_feature_names(preprocessor):
    """Get feature names from the fitted ColumnTransformer."""
    num_features = preprocessor.transformers_[0][2]
    cat_encoder = preprocessor.transformers_[1][1]["encoder"]
    cat_features = cat_encoder.get_feature_names_out(
        preprocessor.transformers_[1][2]
    ).tolist()
    return list(num_features) + cat_features

def preprocess(raw_df):
    """Full preprocessing pipeline - feature engineering + transformation."""
    df = engineer_features(raw_df.copy())
    X_array = preprocessor.transform(df)
    feature_names = get_feature_names(preprocessor)
    X = pd.DataFrame(X_array, columns=feature_names)
    X = clean_column_names(X)
    return X

def predict(raw_df):
    """
    Full prediction pipeline.
    Input:  raw applicant DataFrame (one or more rows)
    Output: list of prediction dictionaries
    """
    X = preprocess(raw_df)
    probs = model.predict_proba(X)[:, 1]

    results = []
    for prob in probs:
        if prob < 0.3:
            risk_tier = "LOW RISK"
            recommendation = "APPROVE"
        elif prob < 0.6:
            risk_tier = "MEDIUM RISK"
            recommendation = "REVIEW"
        else:
            risk_tier = "HIGH RISK"
            recommendation = "DECLINE"

        results.append({
            "probability": round(float(prob), 4),
            "risk_tier": risk_tier,
            "recommendation": recommendation
        })

    return results
