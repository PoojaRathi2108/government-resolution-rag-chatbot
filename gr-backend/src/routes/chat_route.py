# from fastapi import APIRouter, Request
# from fastapi.responses import JSONResponse
# from src.services.chat_service import query_gr

# chat_router = APIRouter()

# @chat_router.post("/askQueries")
# async def ask_queries(request: Request):
#     try:
#         data = await request.json()
#         query_text = data.get("query_text", "").strip()

#         if not query_text:
#             return JSONResponse(
#                 status_code=400,
#                 content={
#                     "status": "error",
#                     "response": "Missing 'query_text' in request",
#                     "sources": []
#                 }
#             )

#         result = query_gr(query_text)
#         return JSONResponse(content=result)
       
#     except Exception as e:
#         return JSONResponse(
#             status_code=500,
#             content={
#                 "status": "error",
#                 "response": f"Server exception: {str(e)}",
#                 "sources": []
#             }
#         )


from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import StreamingResponse
import json
from src.services.chat_service import query_gr
from pydantic import BaseModel


chat_router = APIRouter()

@chat_router.post("/askQueries")
async def ask_queries(request: Request ):
    
    try:
        data = await request.json()
        query_text = data.get("query_text", "").strip()
        user_id = data.get("user_id", "").strip()
        session_id = data.get("session_id", "").strip()

        if not query_text:
            return {
                "status": "error",
                "response": "Missing 'query_text' in request",
                "sources": []
            }

        async def generate():
            try:
                # Initialize with empty response
                yield json.dumps({
                    "status": "streaming",
                    "response": "",
                    "sources": [],
                    "done": False
                }) + "\n"

                # Stream responses from query_gr
                async for chunk in query_gr(query_text, user_id, session_id, stream=True):
                    yield json.dumps(chunk) + "\n"

                # Final done signal
                yield json.dumps({
                    "status": "success",
                    "response": "",
                    "sources": chunk.get("sources", []),
                    "done": True
                }) + "\n"

            except Exception as e:
                yield json.dumps({
                    "status": "error",
                    "response": str(e),
                    "sources": [],
                    "done": True
                }) + "\n"

        return StreamingResponse(generate(), media_type="application/x-ndjson")

    except Exception as e:
        return {
            "status": "error",
            "response": f"Server exception: {str(e)}",
            "sources": []
        }