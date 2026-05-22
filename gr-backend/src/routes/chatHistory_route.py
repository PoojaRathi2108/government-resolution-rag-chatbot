from fastapi import APIRouter, HTTPException
from src.models.chat_models import ChatSessionModel, ChatEntryModel
from pydantic import BaseModel
from typing import Optional, List
from src.services.chat_history import create_chat_history_service , get_chat_history_service, update_chat_history_service, delete_Chat_History, edit_Chat_History_Title, get_All_chat_history_service


chatHistory_router = APIRouter()

class UpdateChatHistoryRequest(BaseModel):
    session_id: str
    session_title: Optional[str] = None
    new_entries: Optional[List[ChatEntryModel]] = None

class EditTitleRequest(BaseModel):
    session_id: str
    new_title: str

@chatHistory_router.get("/getAllChatHistory")
async def getAllChatHistory( userId: str):
    session = await get_All_chat_history_service(userId)
    return {"message": "Chat history", "session": session}

@chatHistory_router.get("/getChatHistory")
async def getChatHistory(session_id: str, userId: str):
    session = await get_chat_history_service(session_id, userId)
    return {"message": "Chat history", "session": session}

@chatHistory_router.put("/deleteChatHistory")
async def deleteChatHistory(session_id: str):
    await delete_Chat_History(session_id)
    return {"message": "Chat history deleted"}

@chatHistory_router.post("/updateChatHistory")
async def updateChatHistory(payload: UpdateChatHistoryRequest):
    return await update_chat_history_service(
        session_id=payload.session_id,
        new_entries=payload.new_entries,
        session_title=payload.session_title
    )

@chatHistory_router.put("/createChatHistory")
async def createChatHistory(session: ChatSessionModel):
    session_id = await create_chat_history_service(session)
    return {"message": "Chat history saved", "id": session_id}

@chatHistory_router.put("/editChatHistoryTitle")
async def editChatHistoryTitle(data: EditTitleRequest):
    await edit_Chat_History_Title(data.session_id, data.new_title)
    return {"message": "Chat history title edited"}