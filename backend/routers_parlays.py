from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from .db import get_db
from . import models, schemas


router = APIRouter(prefix="/parlays", tags=["parlays"])


@router.post("/", response_model=schemas.Parlay)
def create_parlay(parlay: schemas.ParlayCreate, db: Session = Depends(get_db)):
    db_parlay = models.Parlay(
        date=parlay.date,
        stake=parlay.stake,
        potential_payout=parlay.potential_payout,
        sportsbook=parlay.sportsbook,
        status=parlay.status,
        notes=parlay.notes,
    )
    for leg in parlay.legs:
        db_parlay.legs.append(
            models.ParlayLeg(
                leg_type=leg.leg_type,
                team_id=leg.team_id,
                player_id=leg.player_id,
                market=leg.market,
                selection=leg.selection,
                odds=leg.odds,
                result=leg.result,
            )
        )
    db.add(db_parlay)
    db.commit()
    db.refresh(db_parlay)
    return db_parlay


@router.get("/", response_model=List[schemas.Parlay])
def list_parlays(
    db: Session = Depends(get_db),
    start_date: Optional[date] = Query(default=None),
    end_date: Optional[date] = Query(default=None),
    team_id: Optional[int] = Query(default=None),
    player_id: Optional[int] = Query(default=None),
    status: Optional[str] = Query(default=None),
):
    q = db.query(models.Parlay)
    if start_date:
        q = q.filter(models.Parlay.date >= start_date)
    if end_date:
        q = q.filter(models.Parlay.date <= end_date)
    if status:
        q = q.filter(models.Parlay.status == status)
    if team_id:
        q = q.join(models.Parlay.legs).filter(models.ParlayLeg.team_id == team_id)
    if player_id:
        q = q.join(models.Parlay.legs).filter(models.ParlayLeg.player_id == player_id)

    q = q.order_by(models.Parlay.date.desc())
    return q.all()


@router.get("/{parlay_id}", response_model=schemas.Parlay)
def get_parlay(parlay_id: int, db: Session = Depends(get_db)):
    parlay = db.query(models.Parlay).filter(models.Parlay.id == parlay_id).first()
    if not parlay:
        raise HTTPException(status_code=404, detail="Parlay not found")
    return parlay


@router.put("/{parlay_id}", response_model=schemas.Parlay)
def update_parlay(parlay_id: int, data: schemas.ParlayUpdate, db: Session = Depends(get_db)):
    print(f"Updating parlay {parlay_id} with data: {data}")
    parlay = db.query(models.Parlay).filter(models.Parlay.id == parlay_id).first()
    if not parlay:
        raise HTTPException(status_code=404, detail="Parlay not found")

    for field, value in data.model_dump(exclude_unset=True, exclude={"legs"}).items():
        setattr(parlay, field, value)

    if data.legs is not None:
        # Replace legs for simplicity
        parlay.legs.clear()
        for leg in data.legs:
            parlay.legs.append(
                models.ParlayLeg(
                    leg_type=leg.leg_type,
                    team_id=leg.team_id,
                    player_id=leg.player_id,
                    market=leg.market,
                    selection=leg.selection,
                    odds=leg.odds,
                    result=leg.result,
                )
            )
    print("PARLAY")
    print(parlay)
    db.add(parlay)
    db.commit()
    db.refresh(parlay)
    return parlay


@router.delete("/{parlay_id}")
def delete_parlay(parlay_id: int, db: Session = Depends(get_db)):
    parlay = db.query(models.Parlay).filter(models.Parlay.id == parlay_id).first()
    if not parlay:
        raise HTTPException(status_code=404, detail="Parlay not found")
    db.delete(parlay)
    db.commit()
    return {"ok": True}


