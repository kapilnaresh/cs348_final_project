import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class TeamBase(BaseModel):
    name: str
    abbreviation: Optional[str] = None


class TeamCreate(TeamBase):
    pass


class Team(TeamBase):
    id: int

    class Config:
        from_attributes = True


class PlayerBase(BaseModel):
    name: str
    team_id: Optional[int] = None


class PlayerCreate(PlayerBase):
    pass


class Player(PlayerBase):
    id: int

    class Config:
        from_attributes = True


class ParlayLegBase(BaseModel):
    leg_type: str = Field(pattern="^(team|player)$")
    team_id: Optional[int] = None
    player_id: Optional[int] = None
    market: str
    selection: str
    odds: Optional[int] = None
    result: str = Field(default="pending")  # won/lost/push/pending


class ParlayLegCreate(ParlayLegBase):
    pass


class ParlayLeg(ParlayLegBase):
    id: int

    class Config:
        from_attributes = True


class ParlayBase(BaseModel):
    date: datetime.date
    stake: float
    potential_payout: Optional[float] = None
    sportsbook: Optional[str] = None
    status: str = Field(default="pending")  # won/lost/pending
    notes: Optional[str] = None


class ParlayCreate(ParlayBase):
    legs: List[ParlayLegCreate]


class ParlayUpdate(BaseModel):
    date: Optional[datetime.date] = None
    stake: Optional[float] = None
    potential_payout: Optional[float] = None
    sportsbook: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    legs: Optional[List[ParlayLegCreate]] = None


class Parlay(ParlayBase):
    id: int
    legs: List[ParlayLeg]

    class Config:
        from_attributes = True


class ReportFilters(BaseModel):
    start_date: Optional[datetime.date] = None
    end_date: Optional[datetime.date] = None
    team_ids: Optional[List[int]] = None
    player_ids: Optional[List[int]] = None
    min_stake: Optional[float] = None
    max_stake: Optional[float] = None
    status: Optional[str] = None  # won/lost/pending


class ReportStats(BaseModel):
    total_parlays: int
    won_parlays: int
    lost_parlays: int
    pending_parlays: int
    success_rate: float
    average_stake: float
    total_staked: float
    total_returned: float
    net_profit: float
    roi: float
    parlays: List[Parlay]  # List of matching parlays with full details


