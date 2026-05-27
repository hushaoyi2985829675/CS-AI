from pydantic import BaseModel, ConfigDict, EmailStr
from datetime import datetime
from typing import Optional


def _to_camel(name: str) -> str:
    parts = name.split("_")
    return parts[0] + "".join(p.capitalize() for p in parts[1:])


class CamelModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=_to_camel,
        populate_by_name=True,
    )


class UserBase(CamelModel):
    username: str


class UserCreate(UserBase):
    password: str
    steam_id: Optional[str] = None


class UserUpdate(CamelModel):
    steam_id: Optional[str] = None


class User(UserBase):
    id: int
    steam_id: Optional[str] = None

    model_config = ConfigDict(
        alias_generator=_to_camel,
        populate_by_name=True,
        from_attributes=True,
    )


class InventoryItemBase(CamelModel):
    weapon_type: str
    skin_name: str
    rarity: str
    wear: str
    float_value: Optional[float] = None
    price: float
    quantity: int = 1
    image_url: Optional[str] = None
    notes: Optional[str] = None


class InventoryItemCreate(InventoryItemBase):
    pass


class InventoryItemUpdate(CamelModel):
    weapon_type: Optional[str] = None
    skin_name: Optional[str] = None
    rarity: Optional[str] = None
    wear: Optional[str] = None
    float_value: Optional[float] = None
    price: Optional[float] = None
    quantity: Optional[int] = None
    image_url: Optional[str] = None
    notes: Optional[str] = None


class InventoryItem(InventoryItemBase):
    id: int
    user_id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(
        alias_generator=_to_camel,
        populate_by_name=True,
        from_attributes=True,
    )


class AIAdviceBase(CamelModel):
    content: str
    type: str


class AIAdviceCreate(AIAdviceBase):
    pass


class AIAdvice(AIAdviceBase):
    id: int
    user_id: int
    created_at: Optional[datetime] = None

    model_config = ConfigDict(
        alias_generator=_to_camel,
        populate_by_name=True,
        from_attributes=True,
    )


class Token(CamelModel):
    access_token: str
    token_type: str


class TokenData(CamelModel):
    username: Optional[str] = None
