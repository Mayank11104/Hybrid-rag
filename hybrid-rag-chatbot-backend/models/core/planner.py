import json
from models.llm import llm_client

class Planner:
    def __init__(self, schema, prompt):
        self.schema = schema
        self.prompt = prompt

    def plan(self, question):
        schema_text = "\n".join([f"{k} → {v}" for k,v in self.schema.items()])
        full_prompt = self.prompt.replace("{schema}", schema_text)

        response = llm_client.generate(full_prompt + "\nQuestion: " + question)

        raw = response.strip()
        raw = raw.replace("```json","").replace("```","").strip()

        try:
            return json.loads(raw)
        except:
            return {"type":"explain"}
