from pydantic import BaseModel, EmailStr
from typing import Optional

# Schema for user signup request
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

# Schema for user response (excluding password)
class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    is_verified: bool

    class Config:
        orm_mode = True  # Allow ORM objects to be converted into Pydantic models
