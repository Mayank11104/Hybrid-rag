# app/routes/files.py

from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Form
from pathlib import Path
import aiosqlite
from datetime import datetime
import shutil
import uuid
from typing import Optional

from app.database import get_db
from app.models import (
    FileUploadResponse,
    SuccessResponse,
    CategoryFileUploadResponse,
    FileListResponse,
    FileListItem,
    FileCategory
)

# ✏️ CHANGE #1: Import RAG rebuild function
from app.services.rag_service import rebuild_rag_system

router = APIRouter(prefix="/files", tags=["Files"])

# Upload directory
UPLOAD_DIR = Path(__file__).parent.parent.parent / "data" / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


# ✅ NEW: Upload file with category (independent from chat)
@router.post("/upload-category", response_model=CategoryFileUploadResponse)
async def upload_file_with_category(
    file: UploadFile = File(...),
    category: FileCategory = Form(...),
    description: Optional[str] = Form(None),
    db: aiosqlite.Connection = Depends(get_db)
):
    """Upload Excel/CSV file with category"""
    try:
        # Validate file type
        allowed_extensions = [".xlsx", ".xls", ".csv"]
        file_ext = Path(file.filename).suffix.lower()
        
        if file_ext not in allowed_extensions:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type. Allowed: {', '.join(allowed_extensions)}"
            )
        
        # Generate unique file ID and path
        file_id = str(uuid.uuid4())
        unique_filename = f"{file_id}_{file.filename}"
        file_path = UPLOAD_DIR / unique_filename
        
        # Save file to disk
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        file_size = file_path.stat().st_size
        
        # Save to database
        await db.execute(
            """INSERT INTO uploaded_files 
            (id, filename, original_filename, file_path, file_size, file_type, category, description)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                file_id,
                unique_filename,
                file.filename,
                str(file_path),
                file_size,
                file_ext,
                category.value,
                description
            )
        )
        await db.commit()
        
        print(f"✅ File uploaded: {file.filename} | Category: {category.value} | Size: {file_size} bytes")
        
        # ✏️ CHANGE #2: Rebuild RAG system after file upload
        print("🔄 Triggering RAG system rebuild...")
        rebuild_success = await rebuild_rag_system()
        
        if rebuild_success:
            print("✅ RAG system rebuilt successfully")
        else:
            print("⚠️ RAG rebuild completed with warnings")
        
        return CategoryFileUploadResponse(
            file_id=file_id,
            filename=unique_filename,
            original_filename=file.filename,
            file_size=file_size,
            file_type=file_ext,
            category=category,
            uploaded_at=datetime.now().isoformat(),
            description=description
        )
        
    except Exception as e:
        print(f"❌ Upload error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ✅ NEW: List files by category
@router.get("/list-by-category", response_model=FileListResponse)
async def list_files_by_category(
    category: Optional[FileCategory] = None,
    db: aiosqlite.Connection = Depends(get_db)
):
    """List all uploaded files, optionally filtered by category"""
    try:
        if category:
            query = "SELECT * FROM uploaded_files WHERE category = ? ORDER BY uploaded_at DESC"
            cursor = await db.execute(query, (category.value,))
        else:
            query = "SELECT * FROM uploaded_files ORDER BY uploaded_at DESC"
            cursor = await db.execute(query)
        
        rows = await cursor.fetchall()
        
        files = [
            FileListItem(
                file_id=row["id"],
                filename=row["filename"],
                original_filename=row["original_filename"],
                file_size=row["file_size"],
                file_type=row["file_type"],
                category=FileCategory(row["category"]),
                uploaded_at=row["uploaded_at"],
                description=row["description"]
            )
            for row in rows
        ]
        
        return FileListResponse(
            files=files,
            total=len(files),
            category=category
        )
        
    except Exception as e:
        print(f"❌ List files error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ✅ NEW: Delete uploaded file
@router.delete("/delete-category/{file_id}", response_model=SuccessResponse)
async def delete_category_file(file_id: str, db: aiosqlite.Connection = Depends(get_db)):
    """Delete uploaded file by ID"""
    try:
        # Get file info
        cursor = await db.execute(
            "SELECT file_path, original_filename FROM uploaded_files WHERE id = ?",
            (file_id,)
        )
        row = await cursor.fetchone()
        
        if not row:
            raise HTTPException(status_code=404, detail="File not found")
        
        # Delete physical file
        file_path = Path(row["file_path"])
        if file_path.exists():
            file_path.unlink()
            print(f"🗑️ Deleted file: {row['original_filename']}")
        
        # Delete from database
        await db.execute("DELETE FROM uploaded_files WHERE id = ?", (file_id,))
        await db.commit()
        
        # ✏️ CHANGE #3: Rebuild RAG system after file deletion
        print("🔄 Triggering RAG system rebuild after file deletion...")
        rebuild_success = await rebuild_rag_system()
        
        if rebuild_success:
            print("✅ RAG system rebuilt successfully")
        else:
            print("⚠️ RAG rebuild completed with warnings")
        
        return SuccessResponse(
            success=True,
            message=f"File '{row['original_filename']}' deleted successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Delete error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ✅ EXISTING: Upload file for chat (keep for backward compatibility)
@router.post("/upload", response_model=FileUploadResponse)
async def upload_file(
    file: UploadFile = File(...),
    chat_id: str = None,
    db: aiosqlite.Connection = Depends(get_db)
):
    """Upload Excel/CSV file (legacy - linked to chat)"""
    try:
        # Validate file type
        allowed_extensions = [".xlsx", ".xls", ".csv"]
        file_ext = Path(file.filename).suffix.lower()
        
        if file_ext not in allowed_extensions:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type. Allowed: {', '.join(allowed_extensions)}"
            )
        
        # Generate unique file ID and path
        file_id = f"file_{datetime.now().timestamp()}"
        file_path = UPLOAD_DIR / f"{file_id}_{file.filename}"
        
        # Save file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        file_size = file_path.stat().st_size
        
        # Save to database
        if chat_id:
            await db.execute(
                """INSERT INTO files 
                (id, chat_id, filename, file_path, file_size, file_type)
                VALUES (?, ?, ?, ?, ?, ?)""",
                (file_id, chat_id, file.filename, str(file_path), file_size, file_ext)
            )
        
        await db.commit()
        
        # ✏️ CHANGE #4: Rebuild RAG system after legacy upload too
        print("🔄 Triggering RAG system rebuild...")
        await rebuild_rag_system()
        
        return FileUploadResponse(
            file_id=file_id,
            filename=file.filename,
            file_size=file_size,
            chat_id=chat_id or "",
            uploaded_at=datetime.now().isoformat()
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/list/{chat_id}")
async def list_files(chat_id: str, db: aiosqlite.Connection = Depends(get_db)):
    """List all files for a chat"""
    cursor = await db.execute(
        "SELECT * FROM files WHERE chat_id = ? ORDER BY uploaded_at DESC",
        (chat_id,)
    )
    rows = await cursor.fetchall()
    
    return [
        {
            "file_id": row["id"],
            "filename": row["filename"],
            "file_size": row["file_size"],
            "file_type": row["file_type"],
            "uploaded_at": row["uploaded_at"]
        }
        for row in rows
    ]


@router.delete("/{file_id}", response_model=SuccessResponse)
async def delete_file(file_id: str, db: aiosqlite.Connection = Depends(get_db)):
    """Delete uploaded file"""
    # Get file info
    cursor = await db.execute("SELECT file_path FROM files WHERE id = ?", (file_id,))
    row = await cursor.fetchone()
    
    if not row:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Delete physical file
    file_path = Path(row["file_path"])
    if file_path.exists():
        file_path.unlink()
    
    # Delete from database
    await db.execute("DELETE FROM files WHERE id = ?", (file_id,))
    await db.commit()
    
    # ✏️ CHANGE #5: Rebuild RAG after legacy file deletion
    print("🔄 Triggering RAG system rebuild after file deletion...")
    await rebuild_rag_system()
    
    return SuccessResponse(
        success=True,
        message="File deleted successfully"
    )
