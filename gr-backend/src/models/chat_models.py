from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class SourceModel(BaseModel):
    unique_code: str = "UNKNOWN"
    gr_number: str = "UNKNOWN"

class ChatEntryModel(BaseModel):
    query_text: str
    response_text: str
    sources: List[SourceModel] = []
    status: str = "success"
    createdAt: Optional[datetime] = None

class ChatSessionModel(BaseModel):
    userId: str
    session_title: str = "Untitled Session"
    entries: List[ChatEntryModel] = []
    isDeleted: bool = False
    startedAt: Optional[datetime] = None


