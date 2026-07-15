from fastapi import APIRouter

router = APIRouter(prefix="/api")


@router.get("/health")
async def health_check():
    return {"status": "ok", "message": "Sales OS API is running"}
