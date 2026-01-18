# app/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv

from app.database import init_db, close_db
from app.routes import chat, files

# ✏️ CHANGE #1: Import RAG status function
from app.services.rag_service import get_rag_status, initialize_rag_system

# Load environment variables
load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    # Startup
    print("🚀 Starting ARG Supply Tech Chatbot API...")
    await init_db()
    print("✅ Database ready!")
    
    # ✏️ CHANGE #2: Initialize RAG system on startup
    print("🔄 Initializing RAG system...")
    rag_initialized = await initialize_rag_system()
    if rag_initialized:
        print("✅ RAG system ready!")
    else:
        print("⚠️ RAG system will initialize on first query (no files uploaded yet)")
    
    yield
    
    # Shutdown
    print("👋 Shutting down...")
    await close_db()


# Create FastAPI app
app = FastAPI(
    title="ARG Supply Tech Chatbot API",
    description="Hybrid RAG Chatbot for Supply Chain Analytics",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        os.getenv("FRONTEND_URL", "http://localhost:5173"),
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5174"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(chat.router)
app.include_router(files.router)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to ARG Supply Tech Chatbot API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    # ✏️ CHANGE #3: Get RAG system status
    rag_status = get_rag_status()
    
    return {
        "status": "healthy",
        "database": "connected",
        "rag_system": {
            "initialized": rag_status["initialized"],
            "files_loaded": rag_status["files_loaded"],
            "data_rows": rag_status["rows"],
            "data_columns": rag_status["columns"],
            "retriever_available": rag_status["retriever_available"]
        },
        "gcp_vertex_ai": "configured" if os.getenv("GCP_PROJECT_ID") else "not_configured"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", 8000)),
        reload=os.getenv("DEBUG", "True").lower() == "true"
    )
