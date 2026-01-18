# app/services/rag_service.py
"""
Hybrid RAG Chatbot Service - Async Wrapper
Integrates friend's RAG system with FastAPI backend
"""

import os
import asyncio
from pathlib import Path
from typing import Optional, List, Dict
import pandas as pd

# Import friend's RAG components (at ROOT level)
from models.data.loader import load_excel_files
from models.schema.schema_builder import build_schema
from models.core.planner import Planner
from models.core.analytics_engine import AnalyticsEngine
from models.llm.llm_client import generate
from models.rag.schema_docs import build_schema_docs
from models.rag.dataset_summary import build_dataset_summary
from models.rag.embeddings import embed
from models.rag.vectorstore import VectorStore
from models.rag.retriever import Retriever


# ==================== Configuration ====================
UPLOAD_DIR = Path(__file__).parent.parent.parent / "data" / "uploads"
PLANNER_PROMPT_PATH = Path(__file__).parent.parent.parent / "models" / "prompts" / "planner_prompt.txt"


# ==================== RAG State Manager ====================
class RAGState:
    """Manages RAG system state (singleton pattern)"""
    
    def __init__(self):
        self.df: Optional[pd.DataFrame] = None
        self.schema: Optional[Dict] = None
        self.planner: Optional[Planner] = None
        self.engine: Optional[AnalyticsEngine] = None
        self.retriever: Optional[Retriever] = None
        self.initialized: bool = False
        self.file_count: int = 0
        
    def is_initialized(self) -> bool:
        return self.initialized and self.df is not None


# Global RAG state instance
_rag_state = RAGState()


# ==================== Async Wrappers for Sync Functions ====================

async def _load_files_async(file_paths: List[str]) -> pd.DataFrame:
    """Async wrapper for load_excel_files"""
    return await asyncio.to_thread(load_excel_files, file_paths)


async def _build_schema_async(df: pd.DataFrame) -> Dict:
    """Async wrapper for build_schema"""
    return await asyncio.to_thread(build_schema, df)


async def _embed_async(texts: List[str]) -> List:
    """Async wrapper for embed"""
    return await asyncio.to_thread(embed, texts)


async def _generate_async(prompt: str) -> str:
    """Async wrapper for generate (LLM call)"""
    return await asyncio.to_thread(generate, prompt)


async def _planner_plan_async(planner: Planner, question: str) -> Dict:
    """Async wrapper for planner.plan"""
    return await asyncio.to_thread(planner.plan, question)


async def _engine_run_async(engine: AnalyticsEngine, plan: Dict):
    """Async wrapper for engine.run"""
    return await asyncio.to_thread(engine.run, plan)


async def _retriever_get_context_async(retriever: Retriever, question: str) -> str:
    """Async wrapper for retriever.get_context"""
    return await asyncio.to_thread(retriever.get_context, question)


# ==================== Initialization ====================

async def initialize_rag_system(force_rebuild: bool = False) -> bool:
    """
    Initialize or rebuild RAG system
    
    Args:
        force_rebuild: Force rebuild even if already initialized
        
    Returns:
        bool: True if successful, False otherwise
    """
    global _rag_state
    
    try:
        # Check if files exist
        excel_files = list(UPLOAD_DIR.glob("*.xlsx")) + list(UPLOAD_DIR.glob("*.xls")) + list(UPLOAD_DIR.glob("*.csv"))
        
        if not excel_files:
            print("⚠️ No Excel/CSV files found in uploads directory")
            return False
        
        # Check if rebuild needed
        if _rag_state.is_initialized() and not force_rebuild and len(excel_files) == _rag_state.file_count:
            print("✅ RAG system already initialized")
            return True
        
        print(f"🔄 Initializing RAG system with {len(excel_files)} files...")
        
        # Step 1: Load Excel files
        file_paths = [str(f) for f in excel_files]
        _rag_state.df = await _load_files_async(file_paths)
        print(f"📊 Loaded {len(_rag_state.df)} rows, {len(_rag_state.df.columns)} columns")
        
        # Step 2: Build schema
        _rag_state.schema = await _build_schema_async(_rag_state.df)
        print(f"🧠 Schema built: {len(_rag_state.schema)} columns")
        
        # Step 3: Load planner prompt
        with open(PLANNER_PROMPT_PATH, "r", encoding="utf-8") as f:
            planner_prompt = f.read()
        
        # Step 4: Initialize Planner + Analytics Engine
        _rag_state.planner = Planner(_rag_state.schema, planner_prompt)
        _rag_state.engine = AnalyticsEngine(_rag_state.df, _rag_state.schema)
        print("✅ Planner & Analytics Engine initialized")
        
        # Step 5: Build RAG Memory (with quota protection)
        try:
            schema_docs = build_schema_docs(_rag_state.schema)
            dataset_doc = build_dataset_summary(_rag_state.df)
            rag_texts = schema_docs + [dataset_doc]
            
            print("🔄 Creating embeddings...")
            rag_embeddings = await _embed_async(rag_texts)
            
            vectorstore = VectorStore(rag_embeddings, rag_texts)
            _rag_state.retriever = Retriever(vectorstore)
            print("✅ RAG retriever ready")
            
        except Exception as e:
            print(f"⚠️ RAG retriever disabled (embedding error): {str(e)}")
            _rag_state.retriever = None
        
        _rag_state.file_count = len(excel_files)
        _rag_state.initialized = True
        print("🎉 RAG system fully initialized!\n")
        return True
        
    except Exception as e:
        print(f"❌ RAG initialization failed: {str(e)}")
        _rag_state.initialized = False
        return False


# ==================== Follow-up Detection ====================

def is_followup(question: str) -> bool:
    """Check if question is a follow-up"""
    q = question.lower().strip()
    return q in [
        "why", "why?", "explain", "explain?", "how", "how?",
        "compare", "compare?", "what about this", "what about it",
        "more details", "details", "tell me more"
    ]


# ==================== Main RAG Query Function ====================

async def get_rag_response(user_message: str, chat_history: list = None) -> str:
    """
    Get response from RAG system (replaces get_groq_response)
    
    Args:
        user_message: User's question
        chat_history: Previous messages (optional, for context)
        
    Returns:
        Bot's response text
    """
    try:
        # Initialize if needed
        if not _rag_state.is_initialized():
            success = await initialize_rag_system()
            if not success:
                return "Sorry, I don't have any data files loaded yet. Please upload Excel/CSV files first."
        
        # Handle follow-up questions (uses last analytical result)
        # Note: This requires session state management - simplified for now
        if is_followup(user_message):
            explain_prompt = f"""
            You are a business analyst helping explain data analytics.
            
            User asked a follow-up question: {user_message}
            
            Based on the conversation history, provide a clear explanation.
            """
            answer = await _generate_async(explain_prompt)
            return answer
        
        # Step 1: Plan the query
        plan = await _planner_plan_async(_rag_state.planner, user_message)
        
        print(f"📋 Plan: {plan}")
        
        # Step 2: Handle EXPLAIN queries (RAG)
        if plan["type"] == "explain":
            if _rag_state.retriever is None:
                return "I can help with data analysis, but the knowledge retrieval system is currently unavailable. Please ask specific analytical questions instead."
            
            context = await _retriever_get_context_async(_rag_state.retriever, user_message)
            
            prompt = f"""
You are a business analyst for ARG Supply Tech, specializing in supply chain analytics.

Context from the dataset:
{context}

User question:
{user_message}

Provide a clear, helpful explanation based only on the context provided.
"""
            answer = await _generate_async(prompt)
            return answer
        
        # Step 3: Handle ANALYTICS queries
        elif plan["type"] == "analytics":
            # Execute the analytical plan
            result = await _engine_run_async(_rag_state.engine, plan)
            
            if result is None:
                return "I couldn't find any data matching your question. Could you try rephrasing?"
            
            # Generate natural language explanation
            explain_prompt = f"""
You are a financial analyst for ARG Supply Tech.

User question:
{user_message}

Computed analytical result:
{result}

Explain this result in clear, professional business language.
- Use the actual numbers from the result
- Keep it concise (2-3 sentences)
- Don't change or round the numbers
- Focus on insights and meaning
"""
            final_answer = await _generate_async(explain_prompt)
            return final_answer
        
        else:
            # Unknown plan type
            return "I'm not sure how to process that question. Could you try asking differently?"
    
    except Exception as e:
        print(f"❌ RAG Error: {str(e)}")
        return f"Sorry, I encountered an error processing your question. Please try again or rephrase your question."


# ==================== Utility Functions ====================

async def rebuild_rag_system() -> bool:
    """Force rebuild RAG system (call after file upload)"""
    print("🔄 Rebuilding RAG system...")
    return await initialize_rag_system(force_rebuild=True)


def get_rag_status() -> Dict:
    """Get current RAG system status"""
    return {
        "initialized": _rag_state.initialized,
        "files_loaded": _rag_state.file_count,
        "rows": len(_rag_state.df) if _rag_state.df is not None else 0,
        "columns": len(_rag_state.df.columns) if _rag_state.df is not None else 0,
        "retriever_available": _rag_state.retriever is not None
    }
