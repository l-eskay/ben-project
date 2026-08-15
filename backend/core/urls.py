"""Core app URL routes. Mounted under /api/ by the root URLConf."""

from django.urls import path

from . import views

urlpatterns = [
    path("health/", views.health, name="health"),
    path("me/", views.me, name="me"),
    # Hot Shots Tennis League
    path("leagues/", views.LeagueListView.as_view(), name="league-list"),
    path("leagues/<slug:slug>/ladder/", views.LadderView.as_view(), name="league-ladder"),
    path("leagues/<slug:slug>/settings/", views.LeagueSettingsView.as_view(), name="league-settings"),
    path("leagues/<slug:slug>/teams/", views.TeamListCreateView.as_view(), name="team-list"),
    path("leagues/<slug:slug>/teams/<int:pk>/", views.TeamDetailView.as_view(), name="team-detail"),
    path("leagues/<slug:slug>/matches/", views.MatchListCreateView.as_view(), name="match-list"),
    path(
        "leagues/<slug:slug>/matches/<int:pk>/",
        views.MatchDetailView.as_view(),
        name="match-detail",
    ),
    path("leagues/<slug:slug>/fixtures/", views.FixtureListCreateView.as_view(), name="fixture-list"),
    path(
        "leagues/<slug:slug>/fixtures/<int:pk>/",
        views.FixtureDetailView.as_view(),
        name="fixture-detail",
    ),
    path("teams/<int:team_id>/players/", views.TeamPlayersView.as_view(), name="team-players"),
    path(
        "teams/<int:team_id>/players/<int:player_id>/",
        views.PlayerDetailView.as_view(),
        name="player-detail",
    ),
]
