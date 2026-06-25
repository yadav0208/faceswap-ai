from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, Float, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(200), nullable=False)
    full_name = Column(String(100), nullable=True)
    avatar_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    generations = relationship("Generation", back_populates="user", lazy="select")
    saved_looks = relationship("SavedLook", back_populates="user", lazy="select")


class PoseTemplate(Base):
    __tablename__ = "pose_templates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    category = Column(String(50), nullable=False)  # fashion, casual, formal, sports, etc.
    description = Column(Text, nullable=True)
    template_image_path = Column(String(500), nullable=False)
    thumbnail_path = Column(String(500), nullable=True)
    prompt_hint = Column(Text, nullable=True)  # AI prompt hint for generation
    is_premium = Column(Boolean, default=False)
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    generations = relationship("Generation", back_populates="pose_template", lazy="select")


class Generation(Base):
    __tablename__ = "generations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    pose_template_id = Column(Integer, ForeignKey("pose_templates.id"), nullable=False)

    source_image_path = Column(String(500), nullable=False)
    result_image_path = Column(String(500), nullable=True)
    status = Column(String(20), default="pending")  # pending, processing, completed, failed
    error_message = Column(Text, nullable=True)

    style_prompt = Column(Text, nullable=True)
    gender = Column(String(10), nullable=True)  # male, female, auto
    skin_tone = Column(String(20), nullable=True)
    confidence_score = Column(Float, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="generations")
    pose_template = relationship("PoseTemplate", back_populates="generations")


class SavedLook(Base):
    __tablename__ = "saved_looks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    generation_id = Column(Integer, ForeignKey("generations.id"), nullable=False)
    title = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="saved_looks")
