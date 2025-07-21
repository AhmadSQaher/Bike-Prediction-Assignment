import os
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import scipy.stats as stats
from sklearn.preprocessing import LabelEncoder

# File paths and configuration
DATA_FILE = os.path.join('data', 'Bicycle_Thefts_Open_Data.csv')  # Original unbalanced file
OUTPUT_FILE = os.path.join('data', 'Bicycle_Thefts_Open_Data_PreProcessed_v1.csv')
MAPPINGS_DIR = 'mappings'
CORRELATION_THRESHOLD = 0.75

# Ensure the mappings directory exists
if not os.path.exists(MAPPINGS_DIR):
    os.makedirs(MAPPINGS_DIR)

def visualize_missing_values(df):
    """
    Calculate and display the percentage of missing values per column.
    Also plots a bar chart for visual inspection.
    """
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
    """
    Display the top N most frequent categories for a given column.
    """
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
    """
    Drop one feature from each pair of features that has a correlation above the threshold.
    For categorical features, drop the one with more unique values.
    For numeric features, drop the one with higher variance.
    """
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
                            print(f"Dropping {col1} (unique values: {cat_unique_counts[col1]})")
                            columns_to_drop.add(col1)
                        else:
                            print(f"Dropping {col2} (unique values: {cat_unique_counts[col2]})")
                            columns_to_drop.add(col2)
                    elif col1 in num_variances and col2 in num_variances:
                        if num_variances[col1] > num_variances[col2]:
                            print(f"Dropping {col1} (variance: {num_variances[col1]:.2f})")
                            columns_to_drop.add(col1)
                        else:
                            print(f"Dropping {col2} (variance: {num_variances[col2]:.2f})")
                            columns_to_drop.add(col2)
    if columns_to_drop:
        df.drop(columns=list(columns_to_drop), inplace=True)
        print(f"Dropped columns due to high correlation: {list(columns_to_drop)}")
    else:
        print("No highly correlated columns found to drop.")
    return df

def save_label_mapping(label_encoders):
    """
    Save the mapping of original categorical values to encoded numeric values as CSV files.
    """
    for col, mapping in label_encoders.items():
        mapping_df = pd.DataFrame(list(mapping.items()), columns=['Original Category', 'Encoded Value'])
        file_name = os.path.join(MAPPINGS_DIR, f"mapping_{col}.csv")
        mapping_df.to_csv(file_name, index=False)
        print(f"Saved mapping for {col} to {file_name}")

def preprocess_data(df):
    """
    Preprocess the raw data:
      1. Remove rows with STATUS 'UNKNOWN'.
      2. Visualize missing values.
      3. Drop BIKE_MODEL due to sparse information.
      4. Handle missing values (using median for non-normal numeric, mean if normal, and mode for categorical).
      5. Display top categories for categorical columns.
      6. Clean specific categorical columns (BIKE_COLOUR, BIKE_MAKE).
      7. Encode categorical columns and save the mappings.
      8. Plot the correlation matrix and drop highly correlated features.
      
    Note: Undersampling is removed in this version. The full processed dataset (minus UNKNOWN rows) is kept.
    """
    # 1. Remove rows where STATUS is "UNKNOWN"
    initial_rows = len(df)
    df = df[df['STATUS'] != "UNKNOWN"]
    print(f"Removed {initial_rows - len(df)} rows with STATUS 'UNKNOWN'.")

    # 2. Visualize missing values
    visualize_missing_values(df)

    # 3. Drop BIKE_MODEL due to high missing percentage or low information
    if 'BIKE_MODEL' in df.columns:
        print("Dropping 'BIKE_MODEL' due to high missing percentage and sparse information.")
        df.drop(columns=['BIKE_MODEL'], inplace=True)

    # 4. Identify numeric and categorical columns
    numeric_cols = df.select_dtypes(include=np.number).columns.tolist()
    categorical_cols = [col for col in df.columns if not pd.api.types.is_numeric_dtype(df[col])]
    cat_unique_counts = {col: df[col].nunique() for col in categorical_cols}
    num_variances = {col: df[col].var() for col in numeric_cols}

    # 5. Process missing values for each column
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
                # Use median if not normally distributed, otherwise mean
                if p_value < 0.05:
                    median_val = df[col].median()
                    print(f"{col} is not normally distributed. Using median: {median_val}")
                    df[col].fillna(median_val, inplace=True)
                else:
                    print(f"{col} appears normally distributed. Using mean: {mu}")
                    df[col].fillna(mu, inplace=True)
            else:
                show_top_categories(df, col, top_n=10)
                mode_val = df[col].mode()[0]
                print(f"Imputing missing values in {col} with mode: {mode_val}")
                df[col].fillna(mode_val, inplace=True)

    # 6. For categorical columns without missing values, display top categories
    for col in categorical_cols:
        if not df[col].isnull().any():
            show_top_categories(df, col, top_n=10)

    # 7. Additional cleaning for specific categorical columns
    if "BIKE_COLOUR" in df.columns:
        mode_colour = df["BIKE_COLOUR"].mode()[0]
        df["BIKE_COLOUR"] = df["BIKE_COLOUR"].apply(lambda val: mode_colour if str(val).strip().isdigit() else val)
    if "BIKE_MAKE" in df.columns:
        mode_make = df["BIKE_MAKE"].mode()[0]
        df["BIKE_MAKE"] = df["BIKE_MAKE"].apply(lambda val: mode_make if str(val).strip() in ["(UNK)", "-", "0", "?"] else val)

    # 8. Encode categorical columns using LabelEncoder and save mappings for frontend use
    label_encoders = {}
    for col in categorical_cols:
        le = LabelEncoder()
        df[col] = le.fit_transform(df[col])
        label_encoders[col] = dict(zip(le.classes_, le.transform(le.classes_)))
    save_label_mapping(label_encoders)

    # 9. Compute and plot the correlation matrix
    plt.figure(figsize=(12, 10))
    sns.heatmap(df.corr(), annot=True, cmap="coolwarm")
    plt.title("Correlation Matrix")
    plt.show()

    # 10. Drop highly correlated columns based on our threshold
    df = drop_highly_correlated(df, cat_unique_counts, num_variances, threshold=CORRELATION_THRESHOLD)

    return df, label_encoders

def main():
    # Load the raw data
    try:
        df = pd.read_csv(DATA_FILE)
    except FileNotFoundError:
        print(f"Error: File not found at {DATA_FILE}")
        return

    # Preprocess the data (without undersampling)
    processed_df, mappings = preprocess_data(df.copy())
    processed_df.to_csv(OUTPUT_FILE, index=False)
    print(f"Saved preprocessed data to {OUTPUT_FILE}")
    print("\nProcessed DataFrame Head:")
    print(processed_df.head())

if __name__ == "__main__":
    main()
