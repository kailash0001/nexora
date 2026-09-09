from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional

# Auth Schemas
class UserCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)
    role: Optional[str] = "Collaborator"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str
    mfa_enabled: bool

    class Config:
        from_attributes = True

# Wiki Schemas
class WikiCommentCreate(BaseModel):
    text: str

class WikiCommentResponse(BaseModel):
    id: str
    page_id: str
    user: str
    avatar: str
    text: str
    timestamp: str

    class Config:
        from_attributes = True

class WikiPageCreate(BaseModel):
    title: str
    content: str
    workspace_id: str
    parent_id: Optional[str] = None
    tags: Optional[List[str]] = []

class WikiPageUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    tags: Optional[List[str]] = None

class WikiPageResponse(BaseModel):
    id: str
    workspace_id: str
    title: str
    content: str
    parent_id: Optional[str] = None
    tags: List[str]
    updated_at: str
    updated_by: str
    version: int
    comments: List[WikiCommentResponse] = []

    class Config:
        from_attributes = True

# Document Schemas
class DocumentResponse(BaseModel):
    id: str
    workspace_id: str
    name: str
    type: str
    size: str
    uploaded_at: str
    uploaded_by: str
    tags: List[str]

    class Config:
        from_attributes = True

# Search Schemas
class SearchQuery(BaseModel):
    query: str

class SearchResult(BaseModel):
    id: str
    title: str
    content: str
    score: float
    snippet: str

# Assistant / Chat Schemas
class ChatQuery(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str
    sources: List[str]
