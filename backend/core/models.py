"""Domain models.

Convention (CLAUDE.md): models hold data, not behaviour. Business logic
belongs in `core/utils/`.
"""

from django.db import models


class League(models.Model):
    """A division of the Hot Shots Tennis League (Green Ball / Orange Ball)."""

    slug = models.SlugField(unique=True)
    name = models.CharField(max_length=64)
    short_name = models.CharField(max_length=32)
    accent = models.CharField(max_length=7)
    accent_dark = models.CharField(max_length=7)
    blurb = models.TextField(blank=True)

    class Meta:
        ordering = ["slug"]

    def __str__(self):
        return self.name


class LeagueSettings(models.Model):
    """Per-division points config and season label."""

    league = models.OneToOneField(League, on_delete=models.CASCADE, related_name="settings")
    pts_singles_win = models.PositiveIntegerField(default=4)
    pts_doubles_win = models.PositiveIntegerField(default=3)
    pts_per_game = models.FloatField(default=1)
    season_name = models.CharField(max_length=120, default="Current Season")

    def __str__(self):
        return f"{self.league.name} settings"


class Team(models.Model):
    league = models.ForeignKey(League, on_delete=models.CASCADE, related_name="teams")
    name = models.CharField(max_length=120)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class Player(models.Model):
    """A registered player on a team's roster. Normalizes Team.players[]."""

    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name="players")
    name = models.CharField(max_length=120)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class Match(models.Model):
    """A completed round of fixtures between two teams (a scorecard)."""

    league = models.ForeignKey(League, on_delete=models.CASCADE, related_name="matches")
    week = models.CharField(max_length=60, default="Unlabelled round")
    date = models.DateField(null=True, blank=True)
    home_team = models.ForeignKey(Team, on_delete=models.SET_NULL, null=True, related_name="+")
    away_team = models.ForeignKey(Team, on_delete=models.SET_NULL, null=True, related_name="+")

    class Meta:
        ordering = ["-date", "-id"]

    def __str__(self):
        return f"{self.week}: {self.home_team} vs {self.away_team}"


class Rubber(models.Model):
    """A single singles/doubles game within a Match.

    Player names are deliberately free text, not FKs — this is what makes
    the substitute-crediting rule in core/utils/ladder.py work. An admin
    types whoever actually played; the ladder service resolves each name
    back to that person's registered team.
    """

    SINGLES = "singles"
    DOUBLES = "doubles"
    TYPE_CHOICES = [(SINGLES, "Singles"), (DOUBLES, "Doubles")]

    match = models.ForeignKey(Match, on_delete=models.CASCADE, related_name="rubbers")
    type = models.CharField(max_length=8, choices=TYPE_CHOICES, default=SINGLES)
    home_players = models.CharField(max_length=200, blank=True)
    away_players = models.CharField(max_length=200, blank=True)
    home_games = models.PositiveIntegerField(default=0)
    away_games = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["id"]


class Fixture(models.Model):
    """A scheduled draw, not yet played. `match` is set once a result links to it."""

    league = models.ForeignKey(League, on_delete=models.CASCADE, related_name="fixtures")
    week = models.CharField(max_length=60, default="Unlabelled round")
    date = models.DateField(null=True, blank=True)
    home_team = models.ForeignKey(Team, on_delete=models.SET_NULL, null=True, related_name="+")
    away_team = models.ForeignKey(Team, on_delete=models.SET_NULL, null=True, related_name="+")
    notes = models.CharField(max_length=200, blank=True)
    match = models.OneToOneField(
        Match, on_delete=models.SET_NULL, null=True, blank=True, related_name="fixture"
    )

    class Meta:
        ordering = ["date", "id"]

    def __str__(self):
        return f"{self.week}: {self.home_team} vs {self.away_team}"
