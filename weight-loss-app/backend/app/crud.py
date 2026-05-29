from sqlalchemy.orm import Session
from .models import User, InventoryItem, AIAdvice
from .schemas import UserCreate, UserUpdate, InventoryItemCreate, InventoryItemUpdate, AIAdviceCreate
from typing import Optional, List


def get_user(db: Session, user_id: int) -> Optional[User]:
    return db.query(User).filter(User.id == user_id).first()


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email).first()


def get_user_by_username(db: Session, username: str) -> Optional[User]:
    return db.query(User).filter(User.username == username).first()


def get_user_by_steam_id(db: Session, steam_id: str) -> Optional[User]:
    return db.query(User).filter(User.steam_id == steam_id).first()


def create_user_from_steam(db: Session, steam_id: str) -> User:
    from .security import get_password_hash
    import secrets
    username = f"steam_{steam_id}"
    random_password = secrets.token_hex(32)
    hashed_password = get_password_hash(random_password)
    db_user = User(
        username=username,
        hashed_password=hashed_password,
        steam_id=steam_id,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def create_user(db: Session, user: UserCreate) -> User:
    from .security import get_password_hash
    hashed_password = get_password_hash(user.password)
    db_user = User(
        username=user.username,
        hashed_password=hashed_password,
        steam_id=user.steam_id,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def update_user(db: Session, user_id: int, user_update: UserUpdate) -> Optional[User]:
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        return None
    if user_update.steam_id is not None:
        db_user.steam_id = user_update.steam_id
    db.commit()
    db.refresh(db_user)
    return db_user


def create_inventory_item(db: Session, item: InventoryItemCreate, user_id: int) -> InventoryItem:
    db_item = InventoryItem(
        user_id=user_id,
        weapon_type=item.weapon_type,
        skin_name=item.skin_name,
        rarity=item.rarity,
        wear=item.wear,
        float_value=item.float_value,
        price=item.price,
        quantity=item.quantity,
        image_url=item.image_url,
        notes=item.notes,
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item


def get_inventory_items(db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[InventoryItem]:
    return db.query(InventoryItem).filter(InventoryItem.user_id == user_id).order_by(InventoryItem.created_at.desc()).offset(skip).limit(limit).all()


def get_inventory_item(db: Session, item_id: int, user_id: int) -> Optional[InventoryItem]:
    return db.query(InventoryItem).filter(InventoryItem.id == item_id, InventoryItem.user_id == user_id).first()


def update_inventory_item(db: Session, item_id: int, item_update: InventoryItemUpdate, user_id: int) -> Optional[InventoryItem]:
    db_item = db.query(InventoryItem).filter(InventoryItem.id == item_id, InventoryItem.user_id == user_id).first()
    if not db_item:
        return None
    update_data = item_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_item, field, value)
    db.commit()
    db.refresh(db_item)
    return db_item


def delete_inventory_item(db: Session, item_id: int, user_id: int) -> bool:
    db_item = db.query(InventoryItem).filter(InventoryItem.id == item_id, InventoryItem.user_id == user_id).first()
    if not db_item:
        return False
    db.delete(db_item)
    db.commit()
    return True


def get_inventory_stats(db: Session, user_id: int) -> dict:
    items = db.query(InventoryItem).filter(InventoryItem.user_id == user_id).all()
    total_items = len(items)
    total_value = sum(item.price * item.quantity for item in items)
    total_quantity = sum(item.quantity for item in items)
    rarity_dist: dict = {}
    weapon_dist: dict = {}
    for item in items:
        rarity_dist[item.rarity] = rarity_dist.get(item.rarity, 0) + item.quantity
        weapon_dist[item.weapon_type] = weapon_dist.get(item.weapon_type, 0) + item.quantity
    most_valuable = max(items, key=lambda x: x.price * x.quantity) if items else None
    return {
        "total_items": total_items,
        "total_value": round(total_value, 2),
        "total_quantity": total_quantity,
        "rarity_distribution": rarity_dist,
        "weapon_distribution": weapon_dist,
        "most_valuable_item": most_valuable,
    }


def create_ai_advice(db: Session, advice: AIAdviceCreate, user_id: int) -> AIAdvice:
    db_advice = AIAdvice(
        user_id=user_id,
        content=advice.content,
        type=advice.type,
    )
    db.add(db_advice)
    db.commit()
    db.refresh(db_advice)
    return db_advice


def get_ai_advices(db: Session, user_id: int, skip: int = 0, limit: int = 10) -> List[AIAdvice]:
    return db.query(AIAdvice).filter(AIAdvice.user_id == user_id).order_by(AIAdvice.created_at.desc()).offset(skip).limit(limit).all()


def get_latest_ai_advice(db: Session, user_id: int) -> Optional[AIAdvice]:
    return db.query(AIAdvice).filter(AIAdvice.user_id == user_id).order_by(AIAdvice.created_at.desc()).first()
