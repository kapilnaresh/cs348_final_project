from typing import List, Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from .db import get_db
from . import models, schemas


router = APIRouter(prefix="/reports", tags=["reports"])


@router.post("/summary", response_model=schemas.ReportStats)
def summary(filters: schemas.ReportFilters, db: Session = Depends(get_db)):
    q = db.query(models.Parlay)
    if filters.start_date:
        q = q.filter(models.Parlay.date >= filters.start_date)
    if filters.end_date:
        q = q.filter(models.Parlay.date <= filters.end_date)
    if filters.status:
        q = q.filter(models.Parlay.status == filters.status)
    if filters.min_stake is not None:
        q = q.filter(models.Parlay.stake >= filters.min_stake)
    if filters.max_stake is not None:
        q = q.filter(models.Parlay.stake <= filters.max_stake)
    if filters.team_ids:
        q = q.join(models.Parlay.legs).filter(models.ParlayLeg.team_id.in_(filters.team_ids))
    if filters.player_ids:
        q = q.join(models.Parlay.legs).filter(models.ParlayLeg.player_id.in_(filters.player_ids))

    # Use distinct() to avoid duplicates when joining with legs
    if filters.team_ids or filters.player_ids:
        q = q.distinct()

    # Order by date descending
    q = q.order_by(models.Parlay.date.desc())

    parlays = q.all()

    total_parlays = len(parlays)
    won_parlays = sum(1 for p in parlays if p.status == "won")
    lost_parlays = sum(1 for p in parlays if p.status == "lost")
    pending_parlays = sum(1 for p in parlays if p.status == "pending")

    total_staked = sum(p.stake for p in parlays) if parlays else 0.0
    average_stake = (total_staked / total_parlays) if total_parlays else 0.0

    # total_returned: if parlay won and potential_payout provided, count it; if lost then 0; if pending, 0
    total_returned = sum(
        (p.potential_payout or 0.0) if p.status == "won" else 0.0 for p in parlays
    )
    net_profit = total_returned - total_staked
    success_rate = (won_parlays / total_parlays) if total_parlays else 0.0
    roi = (net_profit / total_staked) if total_staked else 0.0

    return schemas.ReportStats(
        total_parlays=total_parlays,
        won_parlays=won_parlays,
        lost_parlays=lost_parlays,
        pending_parlays=pending_parlays,
        success_rate=success_rate,
        average_stake=average_stake,
        total_staked=total_staked,
        total_returned=total_returned,
        net_profit=net_profit,
        roi=roi,
        parlays=parlays,  # Include full parlay details
    )


