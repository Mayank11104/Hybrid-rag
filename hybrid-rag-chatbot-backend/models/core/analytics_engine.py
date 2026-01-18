import pandas as pd


class AnalyticsEngine:
    def __init__(self, df, schema):
        self.df = df
        self.schema = schema

    def _col(self, semantic):
        if semantic not in self.schema:
            raise ValueError(f"Unknown column: {semantic}")
        return self.schema[semantic]

    def run(self, plan):
        if plan["type"] != "analytics":
            return None

        df = self.df.copy()

        for step in plan["steps"]:
            op = step["op"]

            # ------------------------
            # FILTER
            # ------------------------
            if op == "filter":
                col = self._col(step["column"])
                val = str(step["value"]).lower()
                df = df[df[col].astype(str).str.lower() == val]

            # ------------------------
            # GROUP BY
            # ------------------------
            elif op == "groupby":
                col = self._col(step["column"])
                df = df.groupby(col)

            # ------------------------
            # AGGREGATIONS
            # ------------------------
            elif op in ["sum", "avg", "max", "min", "count_unique"]:
                col = self._col(step["metric"])

                # If grouped, return Series
                if isinstance(df, pd.core.groupby.generic.DataFrameGroupBy):
                    if op == "sum":
                        df = df[col].sum()
                    elif op == "avg":
                        df = df[col].mean().round(2)
                    elif op == "max":
                        df = df[col].max()
                    elif op == "min":
                        df = df[col].min()
                    elif op == "count_unique":
                        df = df[col].nunique()

                # If not grouped, return scalar
                else:
                    if op == "sum":
                        return df[col].sum()
                    elif op == "avg":
                        return round(df[col].mean(), 2)
                    elif op == "max":
                        return df[col].max()
                    elif op == "min":
                        return df[col].min()
                    elif op == "count_unique":
                        return df[col].nunique()

            # ------------------------
            # LIST UNIQUE
            # ------------------------
            elif op == "list_unique":
                col = self._col(step["metric"])
                return df[col].dropna().unique().tolist()

            # ------------------------
            # SORT
            # ------------------------
            elif op == "sort":
                ascending = step["order"] == "asc"

                # If grouped result (Series)
                if isinstance(df, pd.Series):
                    df = df.sort_values(ascending=ascending)

                # If DataFrame
                else:
                    col = self._col(step["by"])
                    df = df.sort_values(by=col, ascending=ascending)

            # ------------------------
            # LIMIT
            # ------------------------
            elif op == "limit":
                df = df.head(step["value"])

            else:
                raise ValueError(f"Unknown operation: {op}")

        # ------------------------
        # Final Output
        # ------------------------
        if isinstance(df, pd.Series):
            return df.to_dict()
        elif isinstance(df, pd.DataFrame):
            return df.to_dict(orient="records")
        else:
            return df
