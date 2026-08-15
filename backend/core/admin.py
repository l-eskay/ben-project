"""Django admin registrations."""

from django.contrib import admin

from .models import Fixture, League, LeagueSettings, Match, Player, Rubber, Team


class PlayerInline(admin.TabularInline):
    model = Player
    extra = 0


class TeamAdmin(admin.ModelAdmin):
    list_display = ["name", "league"]
    list_filter = ["league"]
    inlines = [PlayerInline]


class RubberInline(admin.TabularInline):
    model = Rubber
    extra = 0


class MatchAdmin(admin.ModelAdmin):
    list_display = ["week", "date", "league", "home_team", "away_team"]
    list_filter = ["league"]
    inlines = [RubberInline]


class FixtureAdmin(admin.ModelAdmin):
    list_display = ["week", "date", "league", "home_team", "away_team", "match"]
    list_filter = ["league"]


class LeagueSettingsInline(admin.StackedInline):
    model = LeagueSettings
    can_delete = False


class LeagueAdmin(admin.ModelAdmin):
    list_display = ["name", "slug"]
    inlines = [LeagueSettingsInline]


admin.site.register(League, LeagueAdmin)
admin.site.register(Team, TeamAdmin)
admin.site.register(Match, MatchAdmin)
admin.site.register(Fixture, FixtureAdmin)
