from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .db import get_db
from . import models


router = APIRouter(prefix="/seed", tags=["seed"])


@router.post("/")
def seed_basic(db: Session = Depends(get_db)):
    teams = [
        ("Boston Celtics", "BOS"),
        ("Los Angeles Lakers", "LAL"),
        ("Golden State Warriors", "GSW"),
        ("Milwaukee Bucks", "MIL"),
        ("Denver Nuggets", "DEN"),
    ]
    existing = {t.name for t in db.query(models.Team).all()}
    for name, abbr in teams:
        if name not in existing:
            db.add(models.Team(name=name, abbreviation=abbr))
    db.commit()

    # Add a few sample players if not present
    name_to_team = {t.name: t.id for t in db.query(models.Team).all()}
    sample_players = [
        ("Jayson Tatum", name_to_team.get("Boston Celtics")),
        ("LeBron James", name_to_team.get("Los Angeles Lakers")),
        ("Stephen Curry", name_to_team.get("Golden State Warriors")),
        ("Giannis Antetokounmpo", name_to_team.get("Milwaukee Bucks")),
        ("Nikola Jokic", name_to_team.get("Denver Nuggets")),
    ]
    existing_players = {p.name for p in db.query(models.Player).all()}
    for pname, team_id in sample_players:
        if pname not in existing_players:
            db.add(models.Player(name=pname, team_id=team_id))
    db.commit()

    return {"ok": True}


