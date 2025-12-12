from sqlalchemy import Column, Integer, String, Date, Float, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship

from .db import Base


ParlayStatusEnum = ("won", "lost", "pending")
LegResultEnum = ("won", "lost", "push", "pending")


class Team(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    abbreviation = Column(String(10), unique=True, nullable=True)

    players = relationship("Player", back_populates="team")


class Player(Base):
    __tablename__ = "players"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=True)

    team = relationship("Team", back_populates="players")


class Parlay(Base):
    __tablename__ = "parlays"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False, index=True)
    stake = Column(Float, nullable=False)
    potential_payout = Column(Float, nullable=True)
    sportsbook = Column(String(50), nullable=True)
    status = Column(String(10), nullable=False, default="pending")  # won/lost/pending
    notes = Column(Text, nullable=True)

    legs = relationship("ParlayLeg", back_populates="parlay", cascade="all, delete-orphan")


class ParlayLeg(Base):
    __tablename__ = "parlay_legs"

    id = Column(Integer, primary_key=True, index=True)
    parlay_id = Column(Integer, ForeignKey("parlays.id", ondelete="CASCADE"), nullable=False)

    leg_type = Column(String(10), nullable=False)  # team or player
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=True)
    player_id = Column(Integer, ForeignKey("players.id"), nullable=True)

    market = Column(String(100), nullable=False)  # e.g., Points, Rebounds, Moneyline
    selection = Column(String(100), nullable=False)  # e.g., Over 24.5, BOS ML
    odds = Column(Integer, nullable=True)  # American odds, e.g., -110, +250
    result = Column(String(10), nullable=False, default="pending")  # won/lost/push/pending

    parlay = relationship("Parlay", back_populates="legs")
    team = relationship("Team")
    player = relationship("Player")


