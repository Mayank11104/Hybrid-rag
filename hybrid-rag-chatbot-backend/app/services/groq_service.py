# app/services/groq_service.py
from groq import Groq
import os
from dotenv import load_dotenv

load_dotenv()

# Initialize Groq client
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))


async def get_groq_response(user_message: str, chat_history: list = None) -> str:
    """
    Get response from Groq API
    
    Args:
        user_message: User's message
        chat_history: Optional list of previous messages for context
        
    Returns:
        Bot's response text
    """
    try:
        # Build messages array
        messages = []
        
        # System prompt
        messages.append({
            "role": "system",
            "content": "You are a helpful AI assistant for ARG Supply Tech, specializing in supply chain analytics. You help users analyze their Excel/CSV data and answer questions about inventory, costs, procurement, and supply chain operations."
        })
        
        # Add chat history if provided
        if chat_history:
            for msg in chat_history[-10:]:  # Last 10 messages for context
                messages.append({
                    "role": "user" if msg["type"] == "user" else "assistant",
                    "content": msg["content"]
                })
        
        # Add current message
        messages.append({
            "role": "user",
            "content": user_message
        })
        
        # Call Groq API
        response = groq_client.chat.completions.create(
            model="openai/gpt-oss-120b",  # You can change model
            messages=messages,
            temperature=0.7,
            max_tokens=1024,
            top_p=1,
            stream=False
        )
        
        # Extract response
        bot_response = response.choices[0].message.content
        return bot_response
        
    except Exception as e:
        print(f"❌ Groq API Error: {str(e)}")
        return f"Sorry, I encountered an error: {str(e)}"


async def get_groq_response_stream(user_message: str, chat_history: list = None):
    """
    Get streaming response from Groq API (for future use)
    """
    try:
        messages = []
        
        messages.append({
            "role": "system",
            "content": "You are a helpful AI assistant for ARG Supply Tech."
        })
        
        if chat_history:
            for msg in chat_history[-10:]:
                messages.append({
                    "role": "user" if msg["type"] == "user" else "assistant",
                    "content": msg["content"]
                })
        
        messages.append({
            "role": "user",
            "content": user_message
        })
        
        stream = groq_client.chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=messages,
            temperature=0.7,
            max_tokens=1024,
            stream=True
        )
        
        for chunk in stream:
            if chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content
                
    except Exception as e:
        yield f"Error: {str(e)}"
