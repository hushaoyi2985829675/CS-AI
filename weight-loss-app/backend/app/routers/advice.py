from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from ..schemas import User, AIAdvice, AIAdviceCreate
from ..crud import create_ai_advice, get_ai_advices, get_latest_ai_advice, get_inventory_items, get_inventory_stats
from ..database import get_db
from ..security import get_current_user
from ..ai_service import generate_analysis_stream

router = APIRouter(
    prefix="/api/advice",
    tags=["advice"],
)

# 流式生成库存分析报告（SSE）
@router.post("/generate/stream")
def generate_advice_stream_endpoint(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    流式生成 AI 库存分析报告

    以 Server-Sent Events (SSE) 方式逐块返回 AI 生成的分析内容。
    生成完毕后自动保存到数据库。
    """
    items = get_inventory_items(db, user_id=current_user.id, limit=200)
    stats = get_inventory_stats(db, user_id=current_user.id)

    def event_stream():
        full_content = ""
        for chunk in generate_analysis_stream(items, stats):
            full_content += chunk
            yield f"data: {chunk}\n\n"
        advice_create = AIAdviceCreate(content=full_content, type="analysis")
        create_ai_advice(db=db, advice=advice_create, user_id=current_user.id)
        yield "data: [DONE]\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")

# 分页获取 AI 分析报告列表
@router.get("/", response_model=list[AIAdvice])
def read_advices(skip: int = 0, limit: int = 10, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    获取 AI 分析报告列表

    分页获取当前登录用户的历史分析报告，按时间倒序排列。
    - **skip**: 跳过的记录数（默认 0）
    - **limit**: 返回的最大记录数（默认 10）
    """
    advices = get_ai_advices(db, user_id=current_user.id, skip=skip, limit=limit)
    return advices

# 获取最新一条分析报告
@router.get("/latest", response_model=AIAdvice)
def read_latest_advice(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    获取最新一条 AI 分析报告

    返回当前登录用户最近生成的库存分析报告。
    """
    advice = get_latest_ai_advice(db, user_id=current_user.id)
    if advice is None:
        raise HTTPException(status_code=404, detail="暂无分析报告")
    return advice
