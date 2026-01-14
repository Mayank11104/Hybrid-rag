# app/models.py
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from enum import Enum


# File Category Enum
class FileCategory(str, Enum):
    purchase = "purchase"
    hr = "hr"
    finance = "finance"
    other = "other"


# Chat Models
class ChatCreate(BaseModel):
    id: str
    title: str = "New Chat"
    pinned: bool = False


class ChatUpdate(BaseModel):
    title: Optional[str] = None
    pinned: Optional[bool] = None


class ChatResponse(BaseModel):
    id: str
    title: str
    pinned: bool
    created_at: str
    updated_at: str


# Message Models
class MessageCreate(BaseModel):
    id: str
    chat_id: str
    type: str  # 'user' or 'bot'
    content: str


class MessageResponse(BaseModel):
    id: str
    chat_id: str
    type: str
    content: str
    created_at: str


# Chat Request/Response
class ChatRequest(BaseModel):
    chat_id: Optional[str] = None
    message: str


class ChatMessageResponse(BaseModel):
    message_id: str
    content: str
    type: str
    timestamp: str


# File Models
class FileUploadResponse(BaseModel):
    file_id: str
    filename: str
    file_size: int
    chat_id: str
    uploaded_at: str


# ✅ NEW: Category-based File Upload Models
class CategoryFileUploadResponse(BaseModel):
    file_id: str
    filename: str
    original_filename: str
    file_size: int
    file_type: str
    category: FileCategory
    uploaded_at: str
    description: Optional[str] = None


class FileListItem(BaseModel):
    file_id: str
    filename: str
    original_filename: str
    file_size: int
    file_type: str
    category: FileCategory
    uploaded_at: str
    description: Optional[str] = None


class FileListResponse(BaseModel):
    files: List[FileListItem]
    total: int
    category: Optional[FileCategory] = None


# Generic Response
class SuccessResponse(BaseModel):
    success: bool
    message: str
    data: Optional[dict] = None
