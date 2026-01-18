import vertexai
from vertexai.language_models import TextEmbeddingModel
import os
from dotenv import load_dotenv

load_dotenv()

PROJECT_ID = os.getenv("GCP_PROJECT_ID")
LOCATION = os.getenv("GCP_LOCATION", "us-central1")

# Initialize Vertex AI
vertexai.init(project=PROJECT_ID, location=LOCATION)

# Load Google embedding model
embedding_model = TextEmbeddingModel.from_pretrained("gemini-embedding-001")


def embed(texts):
    """
    Converts list of strings into vector embeddings
    using Google Vertex AI embedding model
    """

    if not texts:
        return []

    embeddings = embedding_model.get_embeddings(texts)

    return [e.values for e in embeddings]
