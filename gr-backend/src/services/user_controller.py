from fastapi import HTTPException
from bson import ObjectId
from ..config.db import db
from ..models.user_model import UserSignup, UserLogin
from ..utils.security import hash_password, verify_password, create_access_token


async def signup(data: UserSignup):
    existing = await db.users.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    user = data.dict()
    user["password"] = hash_password(user["password"]) 
    await db.users.insert_one(user)

    return {
        "success": True,
        "message": "User registered successfully",
        "email": user["email"]
    }

async def login(data: UserLogin):
    user = await db.users.find_one({"email": data.email})
    if not user or not verify_password(data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token(data={"sub": str(user["_id"])})

    return {
        "message": "Login successful",
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "_id": str(user["_id"]),
            "name": user["name"],
            "email": user["email"],
            "role": user["role"],
            "mobileNumber": user["mobileNumber"]
        }
    }
