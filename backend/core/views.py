"""HTTP handlers.

Convention (CLAUDE.md): views stay thin — orchestrate, delegate to
`core/utils/` for business logic.

Auth model for the league endpoints: reads are public; writes require any
authenticated user (a single staff login manages both divisions — see the
Hot Shots integration handoff, §10/§12).
"""

from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Fixture, League, Match, Player, Team
from .serializers import (
    FixtureSerializer,
    LeagueSerializer,
    LeagueSettingsSerializer,
    MatchSerializer,
    PlayerSerializer,
    TeamSerializer,
    UserSerializer,
)
from .utils.ladder import compute_ladder


@api_view(["GET"])
@permission_classes([AllowAny])
def health(_request: Request) -> Response:
    """Liveness/readiness probe. Public."""
    return Response({"status": "ok"})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request: Request) -> Response:
    """Return the currently authenticated user."""
    return Response(UserSerializer(request.user).data)


def _league_or_404(slug):
    return get_object_or_404(League.objects.select_related("settings"), slug=slug)


class LeagueListView(generics.ListAPIView):
    """GET /api/leagues/ — both divisions + meta + settings. Public."""

    permission_classes = [AllowAny]
    serializer_class = LeagueSerializer
    queryset = League.objects.select_related("settings").prefetch_related("teams")


class LadderView(APIView):
    """GET /api/leagues/{slug}/ladder/ — server-computed ladder rows. Public."""

    permission_classes = [AllowAny]

    def get(self, request, slug):
        league = _league_or_404(slug)
        return Response(compute_ladder(league))


class LeagueSettingsView(APIView):
    """GET public / PATCH admin — points config + season name."""

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAuthenticated()]

    def get(self, request, slug):
        league = _league_or_404(slug)
        return Response(LeagueSettingsSerializer(league.settings).data)

    def patch(self, request, slug):
        league = _league_or_404(slug)
        serializer = LeagueSettingsSerializer(league.settings, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class TeamListCreateView(generics.ListCreateAPIView):
    serializer_class = TeamSerializer

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        return Team.objects.filter(league__slug=self.kwargs["slug"]).prefetch_related("players")

    def perform_create(self, serializer):
        league = _league_or_404(self.kwargs["slug"])
        serializer.save(league=league)


class TeamDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = TeamSerializer

    def get_queryset(self):
        return Team.objects.filter(league__slug=self.kwargs["slug"])


class TeamPlayersView(APIView):
    """POST /api/teams/{id}/players/ — add a player to a team's roster."""

    permission_classes = [IsAuthenticated]

    def post(self, request, team_id):
        team = get_object_or_404(Team, id=team_id)
        name = (request.data.get("name") or "").strip()
        if not name:
            return Response({"detail": "name is required"}, status=status.HTTP_400_BAD_REQUEST)
        player = Player.objects.create(team=team, name=name)
        return Response(PlayerSerializer(player).data, status=status.HTTP_201_CREATED)


class PlayerDetailView(generics.DestroyAPIView):
    """DELETE /api/teams/{team_id}/players/{player_id}/"""

    permission_classes = [IsAuthenticated]
    serializer_class = PlayerSerializer

    def get_queryset(self):
        return Player.objects.filter(team_id=self.kwargs["team_id"])

    def get_object(self):
        return get_object_or_404(self.get_queryset(), id=self.kwargs["player_id"])


class MatchListCreateView(generics.ListCreateAPIView):
    serializer_class = MatchSerializer

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        return (
            Match.objects.filter(league__slug=self.kwargs["slug"])
            .select_related("home_team", "away_team")
            .prefetch_related("rubbers")
        )

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["league"] = _league_or_404(self.kwargs["slug"])
        return context


class MatchDetailView(generics.DestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = MatchSerializer

    def get_queryset(self):
        return Match.objects.filter(league__slug=self.kwargs["slug"])


class FixtureListCreateView(generics.ListCreateAPIView):
    serializer_class = FixtureSerializer

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        qs = Fixture.objects.filter(league__slug=self.kwargs["slug"]).select_related(
            "home_team", "away_team"
        )
        unscheduled = self.request.query_params.get("unscheduled")
        if unscheduled is not None:
            qs = qs.filter(match__isnull=True)
        return qs

    def perform_create(self, serializer):
        league = _league_or_404(self.kwargs["slug"])
        serializer.save(league=league)


class FixtureDetailView(generics.DestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = FixtureSerializer

    def get_queryset(self):
        return Fixture.objects.filter(league__slug=self.kwargs["slug"])
