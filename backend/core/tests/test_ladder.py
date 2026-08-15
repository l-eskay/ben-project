"""Tests for the ladder computation service (core/utils/ladder.py).

The substitute-crediting rule is the crown jewel ported from the original
single-file app — these tests exist specifically to pin that behaviour
down (see the Hot Shots integration handoff, §6 / §13.6).
"""

import pytest

from core.models import League, LeagueSettings, Match, Player, Rubber, Team
from core.utils.ladder import compute_ladder

pytestmark = pytest.mark.django_db


@pytest.fixture
def league():
    lg = League.objects.create(
        slug="test-league", name="Test League", short_name="Test", accent="#6FA82C", accent_dark="#517D1F"
    )
    LeagueSettings.objects.create(league=lg, pts_singles_win=4, pts_doubles_win=3, pts_per_game=1)
    return lg


def rows_by_name(rows):
    return {r["name"]: r for r in rows}


def test_straightforward_singles_win(league):
    home = Team.objects.create(league=league, name="Aces")
    away = Team.objects.create(league=league, name="Smashers")
    match = Match.objects.create(league=league, home_team=home, away_team=away)
    Rubber.objects.create(
        match=match, type="singles", home_players="Jane", away_players="Sam", home_games=6, away_games=3
    )

    rows = rows_by_name(compute_ladder(league))

    # Home wins the rubber: 6 games * 1pt + 4pt win bonus = 10
    assert rows["Aces"]["points"] == 10
    assert rows["Aces"]["wins"] == 1
    assert rows["Aces"]["rubbersW"] == 1
    assert rows["Aces"]["gamesW"] == 6
    assert rows["Aces"]["gamesL"] == 3
    # Away loses: 3 games * 1pt = 3, no win bonus
    assert rows["Smashers"]["points"] == 3
    assert rows["Smashers"]["losses"] == 1
    assert rows["Smashers"]["rubbersL"] == 1


def test_substitute_points_credited_to_origin_team_not_fixture_team(league):
    """A player registered on Team A fills in for Team B on the day.

    W/L, rubbers, and games must stay with Team B (the fixture team that
    actually played). Only the rubber's points follow the player back to
    Team A (their registered/origin team).
    """
    team_a = Team.objects.create(league=league, name="Team A")
    team_b = Team.objects.create(league=league, name="Team B")
    opponent = Team.objects.create(league=league, name="Opponent")
    Player.objects.create(team=team_a, name="Jane Smith")

    # Team B vs Opponent — Jane (registered on Team A) stands in for Team B.
    match = Match.objects.create(league=league, home_team=team_b, away_team=opponent)
    Rubber.objects.create(
        match=match,
        type="singles",
        home_players="Jane Smith",
        away_players="Sam Lee",
        home_games=6,
        away_games=2,
    )

    rows = rows_by_name(compute_ladder(league))

    # Points (6*1 + 4 win bonus = 10) follow Jane back to Team A.
    assert rows["Team A"]["points"] == 10
    # But Team A didn't play — no W/L/rubbers/games credited to them.
    assert rows["Team A"]["played"] == 0
    assert rows["Team A"]["rubbersW"] == 0
    assert rows["Team A"]["gamesW"] == 0

    # Team B fielded the rubber: games/rubbers/win stay here, but zero points
    # (they all went to Jane's origin team).
    assert rows["Team B"]["points"] == 0
    assert rows["Team B"]["played"] == 1
    assert rows["Team B"]["wins"] == 1
    assert rows["Team B"]["rubbersW"] == 1
    assert rows["Team B"]["gamesW"] == 6
    assert rows["Team B"]["gamesL"] == 2


def test_doubles_points_split_and_credited_per_player(league):
    team_a = Team.objects.create(league=league, name="Team A")
    team_b = Team.objects.create(league=league, name="Team B")
    away = Team.objects.create(league=league, name="Away")
    Player.objects.create(team=team_a, name="Jane")
    # "Bob" is unregistered — falls back to the fixture team (Team B).

    match = Match.objects.create(league=league, home_team=team_b, away_team=away)
    Rubber.objects.create(
        match=match,
        type="doubles",
        home_players="Jane & Bob",
        away_players="Sam & Ali",
        home_games=6,
        away_games=4,
    )

    rows = rows_by_name(compute_ladder(league))

    # Total home points: 6*1 + 3 (doubles win) = 9, split 4.5 / 4.5.
    assert rows["Team A"]["points"] == 4.5  # Jane's share
    assert rows["Team B"]["points"] == 4.5  # Bob's share (unknown -> fixture team)
    assert rows["Team B"]["wins"] == 1
    assert rows["Team B"]["gamesW"] == 6


def test_ambiguous_name_falls_back_to_fixture_team(league):
    """Same name registered on two different teams -> ambiguous -> fixture team."""
    team_a = Team.objects.create(league=league, name="Team A")
    team_c = Team.objects.create(league=league, name="Team C")
    team_b = Team.objects.create(league=league, name="Team B")
    Player.objects.create(team=team_a, name="Sam")
    Player.objects.create(team=team_c, name="Sam")  # ambiguous

    match = Match.objects.create(league=league, home_team=team_b, away_team=team_c)
    Rubber.objects.create(
        match=match, type="singles", home_players="Sam", away_players="Other", home_games=6, away_games=0
    )

    rows = rows_by_name(compute_ladder(league))

    # Ambiguous -> credited to the fixture team (Team B), not Team A or Team C.
    assert rows["Team B"]["points"] == 10
    assert rows["Team A"]["points"] == 0
    assert rows["Team C"]["points"] == 0


def test_tied_rubber_awards_no_win_bonus_and_match_draw(league):
    home = Team.objects.create(league=league, name="Home")
    away = Team.objects.create(league=league, name="Away")
    match = Match.objects.create(league=league, home_team=home, away_team=away)
    Rubber.objects.create(
        match=match, type="singles", home_players="A", away_players="B", home_games=5, away_games=5
    )

    rows = rows_by_name(compute_ladder(league))

    assert rows["Home"]["points"] == 5
    assert rows["Away"]["points"] == 5
    assert rows["Home"]["draws"] == 1
    assert rows["Away"]["draws"] == 1
    assert rows["Home"]["rubbersW"] == 0
    assert rows["Home"]["rubbersL"] == 0


def test_sort_order_points_then_game_diff_then_games_won(league):
    a = Team.objects.create(league=league, name="A")
    b = Team.objects.create(league=league, name="B")
    c = Team.objects.create(league=league, name="C")
    # A: 10pts. B: 6pts but better game diff than C. C: 6pts.
    m1 = Match.objects.create(league=league, home_team=a, away_team=b)
    Rubber.objects.create(match=m1, type="singles", home_games=6, away_games=0)
    m2 = Match.objects.create(league=league, home_team=b, away_team=c)
    Rubber.objects.create(match=m2, type="doubles", home_games=6, away_games=6)

    ordered = [r["name"] for r in compute_ladder(league)]
    assert ordered[0] == "A"


def test_empty_league_returns_empty_ladder(league):
    assert compute_ladder(league) == []
