from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column("username", String(50), unique=True, index=True)
    email = Column("email", String(100), nullable=True, index=True)
    hashed_password = Column("hashedPassword", String(255))
    steam_id = Column("steamId", String(20), nullable=True)
    created_at = Column("createdAt", DateTime, server_default=func.now())

    inventory_items = relationship("InventoryItem", back_populates="user")
    advices = relationship("AIAdvice", back_populates="user")


class InventoryItem(Base):
    __tablename__ = "inventory_items"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column("userId", Integer, ForeignKey("users.id"))
    weapon_type = Column("weaponType", String(100))
    skin_name = Column("skinName", String(200))
    rarity = Column("rarity", String(50))
    wear = Column("wear", String(50))
    float_value = Column("floatValue", Float, nullable=True)
    price = Column("price", Float)
    quantity = Column("quantity", Integer, default=1)
    image_url = Column("imageUrl", String(500), nullable=True)
    notes = Column("notes", Text, nullable=True)
    created_at = Column("createdAt", DateTime, server_default=func.now())
    updated_at = Column("updatedAt", DateTime, server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="inventory_items")


class AIAdvice(Base):
    __tablename__ = "ai_advice"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column("userId", Integer, ForeignKey("users.id"))
    content = Column("content", Text)
    type = Column("type", String(30))
    created_at = Column("createdAt", DateTime, server_default=func.now())

    user = relationship("User", back_populates="advices")
