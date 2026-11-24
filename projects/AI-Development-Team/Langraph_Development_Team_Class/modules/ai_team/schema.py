from typing import Annotated
from uuid import UUID

from pydantic import BaseModel, StringConstraints


class ChatRequest(BaseModel):
    message: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]
    parent_id: UUID | None = None
