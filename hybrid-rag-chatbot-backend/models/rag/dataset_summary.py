def build_dataset_summary(df):
    return f"""
This Excel file contains {len(df)} rows and {len(df.columns)} columns.
It includes business data related to products, vendors, plants, costs, categories, quality ratings, and regions.
It is used for supply chain, procurement, and inventory analysis.
"""
