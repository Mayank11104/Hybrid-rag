# app/routes/chat.py
from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime
import aiosqlite
from typing import List

from app.database import get_db
from app.models import (
    ChatCreate, ChatResponse, ChatUpdate,
    MessageCreate, MessageResponse,
    ChatRequest, ChatMessageResponse,
    SuccessResponse
)
from app.services.groq_service import get_groq_response

router = APIRouter(prefix="/chat", tags=["Chat"])


@router.post("/create", response_model=ChatResponse)
async def create_chat(chat: ChatCreate, db: aiosqlite.Connection = Depends(get_db)):
    """Create a new chat"""
    try:
        await db.execute(
            "INSERT INTO chats (id, title, pinned) VALUES (?, ?, ?)",
            (chat.id, chat.title, int(chat.pinned))
        )
        await db.commit()
        
        # Fetch created chat
        cursor = await db.execute(
            "SELECT * FROM chats WHERE id = ?", (chat.id,)
        )
        row = await cursor.fetchone()
        
        return ChatResponse(
            id=row["id"],
            title=row["title"],
            pinned=bool(row["pinned"]),
            created_at=row["created_at"],
            updated_at=row["updated_at"]
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/list", response_model=List[ChatResponse])
async def list_chats(db: aiosqlite.Connection = Depends(get_db)):
    """Get all chats"""
    cursor = await db.execute(
        "SELECT * FROM chats ORDER BY updated_at DESC"
    )
    rows = await cursor.fetchall()
    
    return [
        ChatResponse(
            id=row["id"],
            title=row["title"],
            pinned=bool(row["pinned"]),
            created_at=row["created_at"],
            updated_at=row["updated_at"]
        )
        for row in rows
    ]


@router.get("/{chat_id}", response_model=ChatResponse)
async def get_chat(chat_id: str, db: aiosqlite.Connection = Depends(get_db)):
    """Get specific chat"""
    cursor = await db.execute(
        "SELECT * FROM chats WHERE id = ?", (chat_id,)
    )
    row = await cursor.fetchone()
    
    if not row:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    return ChatResponse(
        id=row["id"],
        title=row["title"],
        pinned=bool(row["pinned"]),
        created_at=row["created_at"],
        updated_at=row["updated_at"]
    )


@router.put("/{chat_id}", response_model=ChatResponse)
async def update_chat(
    chat_id: str, 
    chat_update: ChatUpdate, 
    db: aiosqlite.Connection = Depends(get_db)
):
    """Update chat (title, pinned status)"""
    updates = []
    params = []
    
    if chat_update.title is not None:
        updates.append("title = ?")
        params.append(chat_update.title)
    
    if chat_update.pinned is not None:
        updates.append("pinned = ?")
        params.append(int(chat_update.pinned))
    
    updates.append("updated_at = CURRENT_TIMESTAMP")
    params.append(chat_id)
    
    query = f"UPDATE chats SET {', '.join(updates)} WHERE id = ?"
    await db.execute(query, params)
    await db.commit()
    
    return await get_chat(chat_id, db)


@router.delete("/{chat_id}", response_model=SuccessResponse)
async def delete_chat(chat_id: str, db: aiosqlite.Connection = Depends(get_db)):
    """Delete chat and all its messages"""
    await db.execute("DELETE FROM chats WHERE id = ?", (chat_id,))
    await db.commit()
    
    return SuccessResponse(
        success=True,
        message="Chat deleted successfully"
    )


@router.get("/{chat_id}/messages", response_model=List[MessageResponse])
async def get_chat_messages(
    chat_id: str, 
    db: aiosqlite.Connection = Depends(get_db)
):
    """Get all messages for a chat"""
    cursor = await db.execute(
        "SELECT * FROM messages WHERE chat_id = ? ORDER BY created_at ASC",
        (chat_id,)
    )
    rows = await cursor.fetchall()
    
    return [
        MessageResponse(
            id=row["id"],
            chat_id=row["chat_id"],
            type=row["type"],
            content=row["content"],
            created_at=row["created_at"]
        )
        for row in rows
    ]


@router.post("/message", response_model=ChatMessageResponse)
async def send_message(
    request: ChatRequest,
    db: aiosqlite.Connection = Depends(get_db)
):
    """Send message and get bot response"""
    try:
        chat_id = request.chat_id
        user_message = request.message
        
        # Generate message IDs
        user_msg_id = f"msg_{datetime.now().timestamp()}"
        bot_msg_id = f"msg_{datetime.now().timestamp() + 1}"
        
        # Save user message
        await db.execute(
            "INSERT INTO messages (id, chat_id, type, content) VALUES (?, ?, ?, ?)",
            (user_msg_id, chat_id, "user", user_message)
        )
        
        # Get chat history for context
        cursor = await db.execute(
            "SELECT type, content FROM messages WHERE chat_id = ? ORDER BY created_at ASC",
            (chat_id,)
        )
        history_rows = await cursor.fetchall()
        chat_history = [
            {"type": row["type"], "content": row["content"]}
            for row in history_rows
        ]
        
        # Get Groq response
        bot_response = await get_groq_response(user_message, chat_history)
        
        # Save bot message
        await db.execute(
            "INSERT INTO messages (id, chat_id, type, content) VALUES (?, ?, ?, ?)",
            (bot_msg_id, chat_id, "bot", bot_response)
        )
        
        # Update chat timestamp
        await db.execute(
            "UPDATE chats SET updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            (chat_id,)
        )
        
        await db.commit()
        
        return ChatMessageResponse(
            message_id=bot_msg_id,
            content=bot_response,
            type="bot",
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/message/save", response_model=SuccessResponse)
async def save_message(
    message: MessageCreate,
    db: aiosqlite.Connection = Depends(get_db)
):
    """Save a message (used by frontend)"""
    try:
        await db.execute(
            "INSERT INTO messages (id, chat_id, type, content) VALUES (?, ?, ?, ?)",
            (message.id, message.chat_id, message.type, message.content)
        )
        await db.commit()
        
        return SuccessResponse(
            success=True,
            message="Message saved successfully"
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
