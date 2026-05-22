from pydantic import BaseModel, EmailStr
from typing import Optional

class UserSignup(BaseModel):
    name: str
    department: str
    role: str
    email: EmailStr
    mobileNumber: str
    password: str
    

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    _id: Optional[str]
    name: str
    email: EmailStr
    mobileNumber: str