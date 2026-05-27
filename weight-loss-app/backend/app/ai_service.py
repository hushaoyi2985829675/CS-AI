from .config import settings
from typing import List, Generator

_client = None


def _get_client():
    global _client
    if _client is None:
        from openai import OpenAI
        _client = OpenAI(
            api_key=settings.MIMO_API_KEY,
            base_url="https://api.xiaomimimo.com/v1",
        )
    return _client


def _build_analysis_prompt(items: list, stats: dict) -> str:
    total_value = stats.get("total_value", 0)
    total_items = stats.get("total_items", 0)
    total_quantity = stats.get("total_quantity", 0)
    rarity_dist = stats.get("rarity_distribution", {})
    weapon_dist = stats.get("weapon_distribution", {})
    most_valuable = stats.get("most_valuable_item")

    items_text = ""
    for item in items[:50]:
        items_text += f"- {item.weapon_type} | {item.skin_name} [{item.rarity}] 磨损:{item.wear} 价格:${item.price} 数量:{item.quantity}\n"

    most_valuable_text = ""
    if most_valuable:
        most_valuable_text = f"最值钱的物品: {most_valuable.weapon_type} | {most_valuable.skin_name} (${most_valuable.price * most_valuable.quantity})"

    rarity_text = ", ".join([f"{k}:{v}" for k, v in rarity_dist.items()]) or "暂无"
    weapon_text = ", ".join([f"{k}:{v}" for k, v in weapon_dist.items()]) or "暂无"

    prompt = f"""
CS2 库存分析数据：
- 库存物品总数: {total_items}
- 库存总数量: {total_quantity}
- 库存总价值: ${total_value:.2f}
- 稀有度分布: {rarity_text}
- 武器类型分布: {weapon_text}
- {most_valuable_text}

库存物品列表（前50个）:
{items_text}

请根据以上数据，给出专业的 CS2 库存分析报告，包括：
1. 库存价值评估（总价值、平均单价）
2. 库存结构分析（武器类型分布、稀有度分布是否合理）
3. 投资建议（哪些物品值得持有，哪些可以考虑出手）
4. 风险提示（库存集中度、市场趋势等）
5. 优化建议（如何调整库存配置以获得更好的价值）

用中文回复，语气专业客观，内容简洁实用，不要超过500字。
"""
    return prompt


def generate_analysis_stream(items: list, stats: dict) -> Generator[str, None, None]:
    prompt = _build_analysis_prompt(items, stats)

    stream = _get_client().chat.completions.create(
        model=settings.MIMO_MODEL,
        messages=[
            {"role": "system", "content": "You are a professional CS2 inventory analyst and trading advisor."},
            {"role": "user", "content": prompt},
        ],
        max_completion_tokens=2048,
        stream=True,
    )

    for chunk in stream:
        if chunk.choices and chunk.choices[0].delta.content is not None:
            yield chunk.choices[0].delta.content
