import os
import pandas as pd
import numpy as np
import pickle
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, f1_score, classification_report, roc_auc_score
from sklearn.utils.class_weight import compute_class_weight

# Import tree-based models
from catboost import CatBoostClassifier
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier

# File paths and configuration
DATA_FILE = os.path.join('data', 'Bicycle_Thefts_Open_Data_PreProcessed_v1.csv')
MODEL_OUTPUT_PATH = os.path.join('models', 'stolen_bike_recovery_prediction_model_v1.pkl')
RANDOM_SEED = 42

def load_preprocessed_data():
    """
    Load the preprocessed data and split into features (X) and target (y).
    Assumes the target column is named 'STATUS'.
    """
    df = pd.read_csv(DATA_FILE)
    if 'STATUS' not in df.columns:
        raise ValueError("STATUS column not found in the preprocessed dataset.")
    X = df.drop('STATUS', axis=1)
    y = df['STATUS']
    return X, y

def select_features_by_importance(model, X, y, top_k=10):
    """
    Fit the model to compute feature importances and return the names of the top_k features.
    """
    model.fit(X, y)
    try:
        importances = model.feature_importances_
    except AttributeError:
        importances = model.get_feature_importance()
    # Sort features by importance (descending) and select the top_k features
    feature_importances = sorted(zip(X.columns, importances), key=lambda x: x[1], reverse=True)
    top_features = [f[0] for f in feature_importances[:top_k]]
    return top_features

def train_and_evaluate(model, X_train, X_test, y_train, y_test):
    """
    Train the model, predict on the test set, and compute evaluation metrics.
    Returns accuracy, weighted F1 score, AUC, classification report, and the trained model.
    """
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)
    try:
        y_proba = model.predict_proba(X_test)[:, 1]
    except Exception:
        y_proba = np.zeros(len(y_test))
    acc = accuracy_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred, average='weighted')
    auc = roc_auc_score(y_test, y_proba) if np.unique(y_test).size > 1 else 0
    report = classification_report(y_test, y_pred)
    return acc, f1, auc, report, model

def main():
    # 1. Load the preprocessed data
    X, y = load_preprocessed_data()

    # 2. Split data into 80% training and 20% testing sets with stratification
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=RANDOM_SEED, stratify=y
    )

    # 3. Compute class weights based on the training set to handle imbalance
    classes = np.unique(y_train)
    class_weights_array = compute_class_weight(class_weight='balanced', classes=classes, y=y_train)
    class_weights = dict(zip(classes, class_weights_array))
    print("Computed class weights:", class_weights)

    results = []

    # ------------------ Approach A: CatBoost ------------------
    print("\n=== CatBoost Feature Importance ===")
    catboost_model = CatBoostClassifier(
        iterations=300,
        learning_rate=0.1,
        depth=6,
        verbose=0,
        random_state=RANDOM_SEED,
        class_weights=[class_weights.get(0, 1), class_weights.get(1, 1)]
    )
    top_features_cat = select_features_by_importance(catboost_model, X_train, y_train, top_k=10)
    X_train_cat = X_train[top_features_cat]
    X_test_cat = X_test[top_features_cat]
    catboost_model_final = CatBoostClassifier(
        iterations=300,
        learning_rate=0.1,
        depth=6,
        verbose=0,
        random_state=RANDOM_SEED,
        class_weights=[class_weights.get(0, 1), class_weights.get(1, 1)]
    )
    cat_acc, cat_f1, cat_auc, cat_report, cat_final_model = train_and_evaluate(
        catboost_model_final, X_train_cat, X_test_cat, y_train, y_test
    )
    print(f"CatBoost Top Features: {top_features_cat}")
    print(f"CatBoost -> Accuracy: {cat_acc:.4f}, F1: {cat_f1:.4f}, AUC: {cat_auc:.4f}")
    print("CatBoost Classification Report:\n", cat_report)
    results.append(("CatBoost", cat_acc, cat_f1, cat_auc, cat_final_model, top_features_cat))

    # ------------------ Approach B: Random Forest ------------------
    print("\n=== Random Forest Feature Importance ===")
    rf_model = RandomForestClassifier(
        n_estimators=200,
        max_depth=10,
        random_state=RANDOM_SEED,
        n_jobs=-1,
        class_weight=class_weights
    )
    top_features_rf = select_features_by_importance(rf_model, X_train, y_train, top_k=10)
    X_train_rf = X_train[top_features_rf]
    X_test_rf = X_test[top_features_rf]
    rf_model_final = RandomForestClassifier(
        n_estimators=200,
        max_depth=10,
        random_state=RANDOM_SEED,
        n_jobs=-1,
        class_weight=class_weights
    )
    rf_acc, rf_f1, rf_auc, rf_report, rf_final_model = train_and_evaluate(
        rf_model_final, X_train_rf, X_test_rf, y_train, y_test
    )
    print(f"Random Forest Top Features: {top_features_rf}")
    print(f"Random Forest -> Accuracy: {rf_acc:.4f}, F1: {rf_f1:.4f}, AUC: {rf_auc:.4f}")
    print("Random Forest Classification Report:\n", rf_report)
    results.append(("RandomForest", rf_acc, rf_f1, rf_auc, rf_final_model, top_features_rf))

    # ------------------ Approach C: XGBoost ------------------
    print("\n=== XGBoost Feature Importance ===")
    # Calculate scale_pos_weight for XGBoost based on the ratio of negative to positive samples
    neg, pos = np.bincount(y_train)
    scale_pos_weight = neg / pos if pos != 0 else 1
    xgb_model = XGBClassifier(
        n_estimators=200,
        learning_rate=0.1,
        max_depth=6,
        eval_metric='logloss',
        random_state=RANDOM_SEED,
        scale_pos_weight=scale_pos_weight
    )
    top_features_xgb = select_features_by_importance(xgb_model, X_train, y_train, top_k=10)
    X_train_xgb = X_train[top_features_xgb]
    X_test_xgb = X_test[top_features_xgb]
    xgb_model_final = XGBClassifier(
        n_estimators=200,
        learning_rate=0.1,
        max_depth=6,
        eval_metric='logloss',
        random_state=RANDOM_SEED,
        scale_pos_weight=scale_pos_weight
    )
    xgb_acc, xgb_f1, xgb_auc, xgb_report, xgb_final_model = train_and_evaluate(
        xgb_model_final, X_train_xgb, X_test_xgb, y_train, y_test
    )
    print(f"XGBoost Top Features: {top_features_xgb}")
    print(f"XGBoost -> Accuracy: {xgb_acc:.4f}, F1: {xgb_f1:.4f}, AUC: {xgb_auc:.4f}")
    print("XGBoost Classification Report:\n", xgb_report)
    results.append(("XGBoost", xgb_acc, xgb_f1, xgb_auc, xgb_final_model, top_features_xgb))

    # ------------------ Model Comparison and Selection ------------------
    best_model_name = None
    best_score = -1
    best_model = None
    best_features = None

    # Compare models using the average of F1 and AUC scores
    for model_name, acc, f1, auc, trained_model, features in results:
        print(f"{model_name} -> Accuracy: {acc:.4f}, F1: {f1:.4f}, AUC: {auc:.4f}")
        score = (f1 + auc) / 2.0
        if score > best_score:
            best_score = score
            best_model_name = model_name
            best_model = trained_model
            best_features = features

    print("\n=== Best Model Selected ===")
    print(f"Best Model: {best_model_name}")
    print(f"Best Score (avg of F1 and AUC): {best_score:.4f}")
    print(f"Features used by the best model: {best_features}")

    # Save the best model and its selected features to a pickle file
    with open(MODEL_OUTPUT_PATH, 'wb') as f:
        pickle.dump({'model': best_model, 'features': best_features}, f)
    print(f"Best model saved to: {MODEL_OUTPUT_PATH}")

if __name__ == "__main__":
    main()
