import os
from dotenv import load_dotenv
import vertexai
from vertexai.generative_models import GenerativeModel

# Load .env
load_dotenv()

PROJECT_ID = os.getenv("GCP_PROJECT_ID")
LOCATION = os.getenv("GCP_LOCATION", "us-central1")
CREDENTIALS_PATH = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")

# -----------------------------
# Initialize Vertex AI ONCE
# -----------------------------
vertexai.init(
    project=PROJECT_ID,
    location=LOCATION
)

# Load Gemini 2.5 Flash
model = GenerativeModel("gemini-2.5-flash")


def generate(prompt):
    """
    Sends a prompt to Gemini 2.5 Flash on Vertex AI.
    Returns clean text output.
    """

    response = model.generate_content(
        prompt,
        generation_config={
            "temperature": 0.2,
            "max_output_tokens": 5000
        }
    )

    return response.text.strip()
