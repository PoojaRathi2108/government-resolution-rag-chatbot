from fastapi import APIRouter, Request, HTTPException
from ..models.user_model import UserSignup, UserLogin
from ..services import user_controller
from ..utils.security import verify_token

auth_router = APIRouter()

@auth_router.post("/signup")
async def signup(user: UserSignup):
    return await user_controller.signup(user)

@auth_router.post("/login")
async def login(user: UserLogin):
    return await user_controller.login(user)

@auth_router.get("/check-token")
def check_token(request: Request):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")

    token = auth_header.split(" ")[1]
    payload = verify_token(token)

    return {"message": "Token is valid", "user_id": payload.get("sub")}