from src.models.chat_models import ChatSessionModel, ChatEntryModel
from fastapi import HTTPException
from ..config.db import db
from datetime import datetime
from bson import ObjectId
from typing import Optional, List
from bson.errors import InvalidId
import logging

logger = logging.getLogger(__name__)


async def get_All_chat_history_service(userId: str):
    try:
        sessions = await db.chat_history.find({
            "isDeleted": False,
            "userId": userId
        }).to_list(length=None)

        # Convert ObjectId and other BSON types to JSON-serializable
        for session in sessions:
            session["_id"] = str(session["_id"])
            # Optional: convert createdAt or other date fields to isoformat if needed
            if "createdAt" in session:
                session["createdAt"] = session["createdAt"].isoformat()

        return sessions

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def create_chat_history_service(data: ChatSessionModel):

    session_dict = data.dict()
    session_dict["startedAt"] = session_dict.get("startedAt") or datetime.utcnow()
    
    for entry in session_dict["entries"]:
        entry["createdAt"] = entry.get("createdAt") or datetime.utcnow()

    result = await db.chat_history.insert_one(session_dict)
    return str(result.inserted_id)


async def get_chat_history_service(session_id: str, userId: str):
    try:
        session_id = ObjectId(session_id)  # Convert session_id only
    except InvalidId:
        return {"error": "Invalid session_id format"}

    try:
        session = await db.chat_history.find_one({
            "_id": session_id,
            "isDeleted": False,
            "userId": userId  # match as string
        })

        if session:
            session["_id"] = str(session["_id"])  # Convert ObjectId for JSON

        return session or {"message": "Session not found"}

    except Exception as e:
        return {"error": str(e)}


async def update_chat_history_service(
    session_id: str,
    new_entries: Optional[List[ChatEntryModel]] = None,
    session_title: Optional[str] = None
):
    try:
        print("this is session id",session_id,"session title",session_title)
        # Validate session_id format
        try:
            ObjectId(session_id)
        except Exception:
            raise HTTPException(
                status_code=400,
                detail="Invalid session ID format"
            )

        if not new_entries and not session_title:
            raise HTTPException(
                status_code=400,
                detail="At least one of new_entries or session_title must be provided"
            )

        update_ops = {
            "$set": {
                "updatedAt": datetime.utcnow()
            }
        }

        # Add session_title if present
        if session_title:
            update_ops["$set"]["session_title"] = session_title

        # Add entries if provided
        if new_entries:
            update_ops["$push"] = {
                "entries": {
                    "$each": []
                }
            }

            for entry in new_entries:
                try:
                    entry_dict = entry.dict(exclude_unset=True)

                    if "createdAt" not in entry_dict:
                        entry_dict["createdAt"] = datetime.utcnow().isoformat()

                    if hasattr(entry, 'sources'):
                        entry_dict["sources"] = [
                            source.dict() if hasattr(source, 'dict') else source
                            for source in entry.sources
                        ]

                    update_ops["$push"]["entries"]["$each"].append(entry_dict)

                except Exception as e:
                    logger.error(f"Error processing entry: {str(e)}")
                    continue

            if not update_ops["$push"]["entries"]["$each"]:
                raise HTTPException(
                    status_code=400,
                    detail="No valid entries provided"
                )

        result = await db.chat_history.update_one(
            {"_id": ObjectId(session_id)},
            update_ops
        )

        if result.matched_count == 0:
            raise HTTPException(
                status_code=404,
                detail=f"Chat session not found (session_id: {session_id})"
            )

        return {
            "status": "success",
            "message": "Chat history updated successfully",
            "modified_count": result.modified_count,
            "entries_added": len(update_ops.get("$push", {}).get("entries", {}).get("$each", []))
        }

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Unexpected error updating chat history: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Internal server error while updating chat history"
        )
async def delete_Chat_History(session_id: str):
    try: 
        result = await db.chat_history.update_one({"_id": ObjectId(session_id)}, {"$set": {"isDeleted": True}   })
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Session not found")
        return {"message": "Session deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def edit_Chat_History_Title(session_id: str, new_title: str):
    try:
        result = await db.chat_history.update_one({"_id": ObjectId(session_id)}, {"$set": {"session_title": new_title}})
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Session not found")
        return {"message": "Session title edited successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))