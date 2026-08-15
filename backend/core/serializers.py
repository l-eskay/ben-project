"""DRF serializers."""

from django.contrib.auth.models import User
from rest_framework import serializers

from .models import Fixture, League, LeagueSettings, Match, Player, Rubber, Team


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name", "is_staff"]
        read_only_fields = fields


class LeagueSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeagueSettings
        fields = ["pts_singles_win", "pts_doubles_win", "pts_per_game", "season_name"]


class PlayerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Player
        fields = ["id", "name"]


class TeamSerializer(serializers.ModelSerializer):
    players = PlayerSerializer(many=True, read_only=True)

    class Meta:
        model = Team
        fields = ["id", "name", "players"]


class LeagueSerializer(serializers.ModelSerializer):
    settings = LeagueSettingsSerializer(read_only=True)
    team_count = serializers.IntegerField(source="teams.count", read_only=True)

    class Meta:
        model = League
        fields = [
            "id",
            "slug",
            "name",
            "short_name",
            "accent",
            "accent_dark",
            "blurb",
            "settings",
            "team_count",
        ]


class RubberSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rubber
        fields = ["id", "type", "home_players", "away_players", "home_games", "away_games"]


class MatchSerializer(serializers.ModelSerializer):
    """Writable nested serializer — rubbers are created/replaced inline."""

    rubbers = RubberSerializer(many=True)
    home_team_name = serializers.CharField(source="home_team.name", read_only=True, default=None)
    away_team_name = serializers.CharField(source="away_team.name", read_only=True, default=None)
    fixture_id = serializers.PrimaryKeyRelatedField(
        source="fixture", queryset=Fixture.objects.all(), required=False, allow_null=True, write_only=True
    )

    class Meta:
        model = Match
        fields = [
            "id",
            "week",
            "date",
            "home_team",
            "away_team",
            "home_team_name",
            "away_team_name",
            "rubbers",
            "fixture_id",
        ]

    def create(self, validated_data):
        rubbers_data = validated_data.pop("rubbers")
        fixture = validated_data.pop("fixture", None)
        league = self.context["league"]
        match = Match.objects.create(league=league, **validated_data)
        for rubber_data in rubbers_data:
            Rubber.objects.create(match=match, **rubber_data)
        if fixture is not None:
            fixture.match = match
            fixture.save(update_fields=["match"])
        return match


class FixtureSerializer(serializers.ModelSerializer):
    home_team_name = serializers.CharField(source="home_team.name", read_only=True, default=None)
    away_team_name = serializers.CharField(source="away_team.name", read_only=True, default=None)

    class Meta:
        model = Fixture
        fields = [
            "id",
            "week",
            "date",
            "home_team",
            "away_team",
            "home_team_name",
            "away_team_name",
            "notes",
            "match",
        ]
        read_only_fields = ["match"]
