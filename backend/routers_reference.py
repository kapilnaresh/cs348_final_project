from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .db import get_db
from . import models, schemas


router = APIRouter(prefix="/ref", tags=["reference"])


@router.get("/teams", response_model=List[schemas.Team])
def list_teams(db: Session = Depends(get_db)):
    return db.query(models.Team).order_by(models.Team.name.asc()).all()


@router.post("/teams", response_model=schemas.Team)
def create_team(team: schemas.TeamCreate, db: Session = Depends(get_db)):
    t = models.Team(name=team.name, abbreviation=team.abbreviation)
    db.add(t)
    db.commit()
    db.refresh(t)
    return t


@router.delete("/teams/{team_id}")
def delete_team(team_id: int, db: Session = Depends(get_db)):
    team = db.query(models.Team).filter(models.Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    try:
        db.delete(team)
        db.commit()
        return {"ok": True}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Cannot delete team: {str(e)}")


@router.get("/players", response_model=List[schemas.Player])
def list_players(db: Session = Depends(get_db)):
    return db.query(models.Player).order_by(models.Player.name.asc()).all()


@router.post("/players", response_model=schemas.Player)
def create_player(player: schemas.PlayerCreate, db: Session = Depends(get_db)):
    p = models.Player(name=player.name, team_id=player.team_id)
    db.add(p)
    db.commit()
    db.refresh(p)
    return p


@router.delete("/players/{player_id}")
def delete_player(player_id: int, db: Session = Depends(get_db)):
    player = db.query(models.Player).filter(models.Player.id == player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    try:
        db.delete(player)
        db.commit()
        return {"ok": True}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Cannot delete player: {str(e)}")


