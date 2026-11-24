from starlette.responses import JSONResponse
from fastapi import Request

import secrets
import os

ALLOWED_ROUTES = [
    "/",
    "/openapi.json",
    "/docs"
]

async def api_authenticate_key(request: Request, call_next):

    # Excluding Public Routes
    if request.url.path in ALLOWED_ROUTES:
        return await call_next(request)

    API_KEY = request.headers.get("X-API-KEY", "")
    OUR_API_KEY = os.getenv("AUTHENTICATED_KEY", "")

    if not secrets.compare_digest(API_KEY, OUR_API_KEY):
        return JSONResponse(
            status_code=403, 
            content={
                "message": "Unauthorized Request"
            })

    return await call_next(request)