import re


def normalize(col):
    col = col.lower()
    col = re.sub(r'[^a-z0-9]+', '_', col)
    return col.strip('_')


def build_schema(df):
    schema = {}

    for col in df.columns:
        semantic = normalize(col)
        schema[semantic] = col

    return schema
