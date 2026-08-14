"""PATCH /api/messages/{message_id}/feedback — thumbs up/down + optional comment."""
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from api.auth import get_current_user
from api.database import get_db
from api.db_models import Conversation, Message
from api.schemas import FeedbackRequest, FeedbackResponse

router = APIRouter(prefix="/api", tags=["feedback"])


@router.patch("/messages/{message_id}/feedback", response_model=FeedbackResponse)
async def set_feedback(
    message_id: str,
    body: FeedbackRequest,
    current_user: Annotated[dict, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Message)
        .join(Conversation, Message.conversation_id == Conversation.id)
        .where(Message.id == message_id, Conversation.user_id == current_user["user_id"])
    )
    message = result.scalar_one_or_none()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")

    message.rating = body.rating
    message.feedback_comment = body.comment
    await db.commit()

    return FeedbackResponse(message_id=message.id, rating=message.rating, comment=message.feedback_comment)
