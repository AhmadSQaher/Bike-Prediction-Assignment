import os
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import scipy.stats as stats
from sklearn.preprocessing import LabelEncoder

# File paths
DATA_FILE = 'data/Bicycle_Thefts_Open_Data.csv'  # original unbalanced file
OUTPUT_FILE = 'data/Bicycle_Thefts_Open_Data_PreProcessed_v2.csv'
MAPPINGS_DIR = 'mappings'
CORRELATION_THRESHOLD = 0.75

# Ensure the mappings directory exists
if not os.path.exists(MAPPINGS_DIR):
    os.makedirs(MAPPINGS_DIR)

def visualize_missing_values(df):
    missing_percentages = (df.isnull().sum() / len(df)) * 100
    print("Missing Value Percentages:")
    print(missing_percentages)
    plt.figure(figsize=(14, 6))
    missing_percentages.sort_values(ascending=False).plot(kind='bar', color='salmon')
    plt.ylabel("Percentage of Missing Values")
    plt.title("Missing Values by Column")
    plt.show()
    return missing_percentages

def show_top_categories(df, col, top_n=10):
    counts = df[col].value_counts()
    percentages = df[col].value_counts(normalize=True) * 100
    top_counts = counts.head(top_n)
    top_percentages = percentages.head(top_n)
    top_values = pd.DataFrame({
        col: top_counts.index,
        "Count": top_counts.values,
        "Percentage": top_percentages.values
    })
    print(f"\nTop {top_n} most frequent values for {col}:")
    print(top_values.to_string(index=False))
    return top_values

def drop_highly_correlated(df, cat_unique_counts, num_variances, threshold=CORRELATION_THRESHOLD):
    corr_matrix = df.corr().abs()
    upper = corr_matrix.where(np.triu(np.ones(corr_matrix.shape), k=1).astype(bool))
    columns_to_drop = set()
    for col1 in df.columns:
        for col2 in df.columns:
            if col1 == col2:
                continue
            if col1 in columns_to_drop or col2 in columns_to_drop:
                continue
            if col1 in upper.index and col2 in upper.columns:
                corr_val = upper.loc[col1, col2]
                if pd.notnull(corr_val) and corr_val > threshold:
                    print(f"High correlation detected: {col1} vs {col2} = {corr_val:.2f}")
                    if col1 in cat_unique_counts and col2 in cat_unique_counts:
                        if cat_unique_counts[col1] > cat_unique_counts[col2]:
                            print(f"Dropping {col1} (unique values: {cat_unique_counts[col1]}) over {col2} (unique values: {cat_unique_counts[col2]})")
                            columns_to_drop.add(col1)
                        else:
                            print(f"Dropping {col2} (unique values: {cat_unique_counts[col2]}) over {col1} (unique values: {cat_unique_counts[col1]})")
                            columns_to_drop.add(col2)
                    elif col1 in num_variances and col2 in num_variances:
                        if num_variances[col1] > num_variances[col2]:
                            print(f"Dropping {col1} (variance: {num_variances[col1]:.2f}) over {col2} (variance: {num_variances[col2]:.2f})")
                            columns_to_drop.add(col1)
                        else:
                            print(f"Dropping {col2} (variance: {num_variances[col2]:.2f}) over {col1} (variance: {num_variances[col1]:.2f})")
                            columns_to_drop.add(col2)
    if columns_to_drop:
        df.drop(columns=list(columns_to_drop), inplace=True)
        print(f"Dropped columns due to high correlation: {list(columns_to_drop)}")
    else:
        print("No highly correlated columns found to drop.")
    return df

def save_label_mapping(label_encoders):
    for col, mapping in label_encoders.items():
        mapping_df = pd.DataFrame(list(mapping.items()), columns=['Original Category', 'Encoded Value'])
        file_name = os.path.join(MAPPINGS_DIR, f"mapping_{col}.csv")
        mapping_df.to_csv(file_name, index=False)
        print(f"Saved mapping for {col} to {file_name}")

def preprocess_data(df):
    # Remove rows with STATUS value "UNKNOWN"
    initial_rows = len(df)
    df = df[df['STATUS'] != "UNKNOWN"]
    print(f"Removed {initial_rows - len(df)} rows with STATUS 'UNKNOWN'.")

    # Visualize missing values
    missing_percentages = visualize_missing_values(df)

    # Drop BIKE_MODEL (as before)
    if 'BIKE_MODEL' in df.columns:
        print("Dropping 'BIKE_MODEL' due to high missing percentage and sparse information.")
        df.drop(columns=['BIKE_MODEL'], inplace=True)

    # Identify numeric and categorical columns
    numeric_cols = df.select_dtypes(include=np.number).columns.tolist()
    categorical_cols = [col for col in df.columns if not pd.api.types.is_numeric_dtype(df[col])]

    cat_unique_counts = {col: df[col].nunique() for col in categorical_cols}
    num_variances = {col: df[col].var() for col in numeric_cols}

    # Process missing values
    for col in df.columns:
        if df[col].isnull().any():
            print(f"\nHandling missing values for column: {col}")
            if col in numeric_cols:
                plt.figure(figsize=(12, 5))
                plt.subplot(1, 2, 1)
                sns.histplot(df[col].dropna(), kde=True, bins=30)
                plt.title(f"Distribution of {col}")
                plt.subplot(1, 2, 2)
                stats.probplot(df[col].dropna(), dist="norm", plot=plt)
                plt.title(f"Q-Q Plot of {col}")
                plt.show()

                non_null_data = df[col].dropna()
                mu, sigma = non_null_data.mean(), non_null_data.std()
                stat, p_value = stats.kstest(non_null_data, 'norm', args=(mu, sigma))
                print(f"K-S Test for {col}: Statistic={stat:.4f}, p-value={p_value:.4f}")

                if p_value < 0.05:
                    median_val = df[col].median()
                    print(f"{col} is not normally distributed. Using median imputation: {median_val}")
                    df[col].fillna(median_val, inplace=True)
                else:
                    print(f"{col} appears normally distributed. Using mean imputation: {mu}")
                    df[col].fillna(mu, inplace=True)
            else:
                show_top_categories(df, col, top_n=10)
                mode_val = df[col].mode()[0]
                print(f"Imputing missing values in {col} with mode: {mode_val}")
                df[col].fillna(mode_val, inplace=True)

    for col in categorical_cols:
        if not df[col].isnull().any():
            show_top_categories(df, col, top_n=10)

    # Additional cleaning for categorical values:
    if "BIKE_COLOUR" in df.columns:
        mode_colour = df["BIKE_COLOUR"].mode()[0]
        def clean_colour(val):
            s = str(val).strip()
            if s.isdigit():
                return mode_colour
            else:
                return val
        df["BIKE_COLOUR"] = df["BIKE_COLOUR"].apply(clean_colour)

    if "BIKE_MAKE" in df.columns:
        mode_make = df["BIKE_MAKE"].mode()[0]
        def clean_make(val):
            s = str(val).strip()
            if s in ["(UNK)", "-", "0", "?"]:
                return mode_make
            else:
                return val
        df["BIKE_MAKE"] = df["BIKE_MAKE"].apply(clean_make)

    # Encode categorical columns using LabelEncoder
    label_encoders = {}
    for col in categorical_cols:
        le = LabelEncoder()
        df[col] = le.fit_transform(df[col])
        label_encoders[col] = dict(zip(le.classes_, le.transform(le.classes_)))

    # Save label mappings for frontend use
    save_label_mapping(label_encoders)

    # Note: We are NOT applying StandardScaler here so that numeric columns remain in their original units.
    # Compute and plot a correlation matrix
    plt.figure(figsize=(12, 10))
    sns.heatmap(df.corr(), annot=True, cmap="coolwarm")
    plt.title("Correlation Matrix")
    plt.show()

    # Drop highly correlated columns
    df = drop_highly_correlated(df, cat_unique_counts, num_variances, threshold=CORRELATION_THRESHOLD)

    return df, label_encoders

def main():
    try:
        df = pd.read_csv(DATA_FILE)
    except FileNotFoundError:
        print(f"Error: File not found at {DATA_FILE}")
        return

    processed_df, mappings = preprocess_data(df.copy())

    processed_df.to_csv(OUTPUT_FILE, index=False)
    print(f"Saved preprocessed data to {OUTPUT_FILE}")

    print("\nProcessed DataFrame Head:")
    print(processed_df.head())

if __name__ == "__main__":
    main()
