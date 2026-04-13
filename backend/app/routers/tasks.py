from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app import models, schemas
from app.auth import get_current_user
from app.database import get_db

router = APIRouter(prefix="/tasks", tags=["tasks"])
 
 
def serialize_tags(tags: list) -> str:
    """Convert list of tags to comma-separated string for storage."""
    return ",".join(tags) if tags else ""
 
 
@router.get("/", response_model=List[schemas.TaskOut])
def get_tasks(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Return all tasks belonging to the authenticated user."""
    return db.query(models.Task).filter(models.Task.owner_id == current_user.id).all()


@router.post("/", response_model=schemas.TaskOut, status_code=status.HTTP_201_CREATED)
def create_task(
    payload: schemas.TaskCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    data = payload.model_dump()
    data["tags"] = serialize_tags(data.get("tags") or [])
    task = models.Task(**data, owner_id=current_user.id)
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.get("/{task_id}", response_model=schemas.TaskOut)
def get_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return _get_task_or_404(db, task_id, current_user.id)


@router.put("/{task_id}", response_model=schemas.TaskOut)
def update_task(
    task_id: int,
    payload: schemas.TaskUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    task = _get_task_or_404(db, task_id, current_user.id)

    update_data = payload.model_dump(exclude_unset=True)
    if "tags" in update_data:
        update_data["tags"] = serialize_tags(update_data["tags"] or [])
    for field, value in update_data.items():
        setattr(task, field, value)

    db.commit()
    db.refresh(task)
    return task


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    task = _get_task_or_404(db, task_id, current_user.id)
    db.delete(task)
    db.commit()


# ── Helpers ───────────────────────────────────────────────────────────────────

def _get_task_or_404(db: Session, task_id: int, user_id: int) -> models.Task:
    task = (
        db.query(models.Task)
        .filter(models.Task.id == task_id, models.Task.owner_id == user_id)
        .first()
    )
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task
