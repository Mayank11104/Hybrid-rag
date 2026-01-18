from dotenv import load_dotenv
import os
import vertexai
from vertexai.generative_models import GenerativeModel

# Load environment variables
load_dotenv()

# Get credentials from .env
PROJECT_ID = os.getenv("GCP_PROJECT_ID")
LOCATION = os.getenv("GCP_LOCATION", "us-central1")
CREDENTIALS_PATH = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")

def test_gemini():
    print("🚀 Testing Gemini 2.5 Flash on GCP Vertex AI...")
    print(f"📍 Project: {PROJECT_ID}")
    print(f"📍 Location: {LOCATION}")
    print(f"📍 Credentials: {CREDENTIALS_PATH}\n")
    
    try:
        # Initialize Vertex AI
        print("⚙️  Initializing Vertex AI...")
        vertexai.init(project=PROJECT_ID, location=LOCATION)
        print("✅ Vertex AI initialized\n")
        
        # Create model
        print("🤖 Loading Gemini 2.5 Flash model...")
        model = GenerativeModel("gemini-2.5-flash")
        print("✅ Model loaded\n")
        
        # Test 1: Simple greeting
        print("📝 Test 1: Simple Greeting")
        print("-" * 50)
        response = model.generate_content("Say hello and confirm you're Gemini 2.5 Flash!")
        print(f"Response: {response.text}\n")
        
        # Test 2: Excel-related query
        print("📊 Test 2: Excel Analysis Test")
        print("-" * 50)
        prompt = """Analyze this Excel data:

Product | Sales | Region
Apple   | 100   | North
Banana  | 150   | South
Orange  | 120   | North

Question: What is the total sales for the North region?"""
        
        response = model.generate_content(prompt)
        print(f"Response: {response.text}\n")
        
        # Test 3: With generation config
        print("🔢 Test 3: Configuration Test")
        print("-" * 50)
        response = model.generate_content(
            "List 3 benefits of RAG systems in 50 words.",
            generation_config={
                "max_output_tokens": 200,
                "temperature": 0.7,
            }
        )
        print(f"Response: {response.text}\n")
        
        # Success
        print("=" * 50)
        print("🎉 SUCCESS! Gemini 2.5 Flash is working!")
        print("=" * 50)
        print("\n✅ Ready to integrate with your hybrid RAG system!")
        print("✅ Your GCP credits will be used automatically")
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}\n")
        print("Troubleshooting:")
        print("1. Check your .env file values")
        print("2. Ensure service account key file exists")
        print("3. Enable Vertex AI API:")
        print("   gcloud services enable aiplatform.googleapis.com")
        print("4. Check GCP credits are available")

if __name__ == "__main__":
    test_gemini()
