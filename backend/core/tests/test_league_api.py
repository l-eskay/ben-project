"""API-level tests for the Hot Shots Tennis League endpoints."""

import pytest
from django.urls import reverse

from core.models import Fixture, League, LeagueSettings, Team

pytestmark = pytest.mark.django_db


@pytest.fixture
def league():
    lg = League.objects.create(
        slug="test-league", name="Test League", short_name="Test", accent="#6FA82C", accent_dark="#517D1F"
    )
    LeagueSettings.objects.create(league=lg)
    return lg


def test_league_list_is_public(api_client, league):
    response = api_client.get(reverse("league-list"))
    assert response.status_code == 200
    slugs = [row["slug"] for row in response.json()]
    assert "test-league" in slugs


def test_ladder_endpoint_is_public(api_client, league):
    response = api_client.get(reverse("league-ladder", args=[league.slug]))
    assert response.status_code == 200
    assert response.json() == []


def test_team_create_requires_auth(api_client, league):
    response = api_client.post(reverse("team-list", args=[league.slug]), {"name": "Aces"})
    assert response.status_code == 401


def test_team_create_succeeds_when_authenticated(authenticated_client, league):
    response = authenticated_client.post(reverse("team-list", args=[league.slug]), {"name": "Aces"})
    assert response.status_code == 201
    assert Team.objects.filter(league=league, name="Aces").exists()


def test_add_and_remove_player(authenticated_client, league):
    team = Team.objects.create(league=league, name="Aces")
    add_response = authenticated_client.post(
        reverse("team-players", args=[team.id]), {"name": "Jane Smith"}
    )
    assert add_response.status_code == 201
    player_id = add_response.json()["id"]

    remove_response = authenticated_client.delete(
        reverse("player-detail", args=[team.id, player_id])
    )
    assert remove_response.status_code == 204
    assert not team.players.filter(id=player_id).exists()


def test_enter_result_updates_ladder_and_links_fixture(authenticated_client, league):
    home = Team.objects.create(league=league, name="Home")
    away = Team.objects.create(league=league, name="Away")
    fixture = Fixture.objects.create(league=league, home_team=home, away_team=away, week="Round 1")

    payload = {
        "week": "Round 1",
        "date": "2026-05-10",
        "home_team": home.id,
        "away_team": away.id,
        "fixture_id": fixture.id,
        "rubbers": [
            {"type": "singles", "home_players": "Jane", "away_players": "Sam", "home_games": 6, "away_games": 2}
        ],
    }
    response = authenticated_client.post(
        reverse("match-list", args=[league.slug]), payload, format="json"
    )
    assert response.status_code == 201

    fixture.refresh_from_db()
    assert fixture.match_id == response.json()["id"]

    ladder = authenticated_client.get(reverse("league-ladder", args=[league.slug])).json()
    home_row = next(r for r in ladder if r["name"] == "Home")
    assert home_row["points"] == 10  # 6 games + 4 singles win bonus


def test_settings_patch_requires_auth(api_client, league):
    response = api_client.patch(
        reverse("league-settings", args=[league.slug]), {"pts_singles_win": 5}, content_type="application/json"
    )
    assert response.status_code == 401


def test_settings_patch_updates_points(authenticated_client, league):
    response = authenticated_client.patch(
        reverse("league-settings", args=[league.slug]), {"pts_singles_win": 5}, format="json"
    )
    assert response.status_code == 200
    league.settings.refresh_from_db()
    assert league.settings.pts_singles_win == 5
