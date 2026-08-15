"""Seed the Green Ball / Orange Ball divisions (Hot Shots Tennis League)."""

from django.db import migrations

LEAGUES = [
    {
        "slug": "green",
        "name": "Green Ball",
        "short_name": "Green",
        "accent": "#6FA82C",
        "accent_dark": "#517D1F",
        "blurb": (
            "The step-up division at KT Academy — full court, tour-transition balls, "
            "for players building toward full-court competition."
        ),
    },
    {
        "slug": "orange",
        "name": "Orange Ball",
        "short_name": "Orange",
        "accent": "#E2822E",
        "accent_dark": "#B7631C",
        "blurb": (
            "The developing-player division — modified court and lower-compression "
            "balls, focused on rally skills and match craft."
        ),
    },
]


def seed_leagues(apps, schema_editor):
    League = apps.get_model("core", "League")
    LeagueSettings = apps.get_model("core", "LeagueSettings")
    for data in LEAGUES:
        league, _ = League.objects.get_or_create(slug=data["slug"], defaults=data)
        LeagueSettings.objects.get_or_create(league=league)


def unseed_leagues(apps, schema_editor):
    League = apps.get_model("core", "League")
    League.objects.filter(slug__in=[d["slug"] for d in LEAGUES]).delete()


class Migration(migrations.Migration):
    dependencies = [("core", "0001_initial")]

    operations = [migrations.RunPython(seed_leagues, unseed_leagues)]
