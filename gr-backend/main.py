from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
from dotenv import load_dotenv


from src.routes.chat_route import chat_router
from src.routes.user_routes import auth_router
from src.routes.chatHistory_route import chatHistory_router



load_dotenv()

app = FastAPI()

# Parse allowed origins from env
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")
origin_list = [origin.strip() for origin in allowed_origins.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(chat_router, prefix="/api")
#app.include_router(auth_router, prefix="/api")
app.include_router(auth_router, prefix="/api")
app.include_router(chatHistory_router, prefix="/api")


# Start server directly
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=5000, reload=True)

