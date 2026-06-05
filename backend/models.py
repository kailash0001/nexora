import datetime
import json
from sqlalchemy import Column, String, Integer, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="Collaborator") # Administrator, Editor, Collaborator
    mfa_enabled = Column(Boolean, default=False)
    mfa_secret = Column(String, nullable=True)

class Workspace(Base):
    __tablename__ = "workspaces"
    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    icon = Column(String, default="💻")
    members_count = Column(Integer, default=1)

class WikiPage(Base):
    __tablename__ = "wiki_pages"
    id = Column(String, primary_key=True, index=True)
    workspace_id = Column(String, ForeignKey("workspaces.id"), nullable=False)
    title = Column(String, index=True, nullable=False)
    content = Column(Text, nullable=False)
    parent_id = Column(String, nullable=True)
    tags_json = Column(String, default="[]") # JSON list of tags
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_by = Column(String, nullable=False)
    version = Column(Integer, default=1)

    comments = relationship("WikiComment", back_populates="page", cascade="all, delete-orphan")

    @property
    def tags(self):
        return json.loads(self.tags_json)

    @tags.setter
    def tags(self, val):
        self.tags_json = json.dumps(val)

class WikiComment(Base):
    __tablename__ = "wiki_comments"
    id = Column(String, primary_key=True, index=True)
    page_id = Column(String, ForeignKey("wiki_pages.id"), nullable=False)
    user = Column(String, nullable=False)
    avatar = Column(String, default="G")
    text = Column(Text, nullable=False)
    timestamp = Column(String, nullable=False)

    page = relationship("WikiPage", back_populates="comments")

class Document(Base):
    __tablename__ = "documents"
    id = Column(String, primary_key=True, index=True)
    workspace_id = Column(String, ForeignKey("workspaces.id"), nullable=False)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False) # PDF, DOCX, etc.
    size = Column(String, nullable=False)
    uploaded_at = Column(String, nullable=False)
    uploaded_by = Column(String, nullable=False)
    tags_json = Column(String, default="[]")

    chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan")

    @property
    def tags(self):
        return json.loads(self.tags_json)

    @tags.setter
    def tags(self, val):
        self.tags_json = json.dumps(val)

class DocumentChunk(Base):
    __tablename__ = "document_chunks"
    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(String, ForeignKey("documents.id"), nullable=False)
    text_content = Column(Text, nullable=False)
    # Store embedding array as JSON string for local SQLite support
    embedding_json = Column(Text, nullable=False) 

    document = relationship("Document", back_populates="chunks")

    @property
    def embedding(self):
        return json.loads(self.embedding_json)

    @embedding.setter
    def embedding(self, vector_list):
        self.embedding_json = json.dumps(vector_list)

class ActivityLog(Base):
    __tablename__ = "activity_logs"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    type = Column(String, default="info") # info, success, warning, ai
    time = Column(String, nullable=False)
    read = Column(Boolean, default=False)
