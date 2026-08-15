"""Ladder computation for a League.

Ported exactly from the original single-file app's `computeLadder` /
`buildPlayerOriginMap` / `creditOrigin` (see the Hot Shots integration
handoff). This is the one authoritative implementation — the frontend
only renders what `compute_ladder` returns, it does not recompute.

Rules preserved from the source:
  - games/rubbers/W-L-D stay with the FIXTURE teams (who actually played).
  - `points` follow the PLAYER back to their registered ("origin") team —
    so a stand-in playing for another team still banks points for their
    own team. An unknown or ambiguous (same name on two teams) player
    name falls back to crediting the fixture team instead.
  - sort order: points desc, game differential desc, games won desc.
"""

import re
from dataclasses import dataclass

AMBIGUOUS = "AMBIGUOUS"

_NAME_SPLIT_RE = re.compile(r"[&,]")


@dataclass
class LadderRow:
    id: int
    name: str
    played: int = 0
    wins: int = 0
    losses: int = 0
    draws: int = 0
    rubbers_w: int = 0
    rubbers_l: int = 0
    games_w: int = 0
    games_l: int = 0
    points: float = 0.0

    def as_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "played": self.played,
            "wins": self.wins,
            "losses": self.losses,
            "draws": self.draws,
            "rubbersW": self.rubbers_w,
            "rubbersL": self.rubbers_l,
            "gamesW": self.games_w,
            "gamesL": self.games_l,
            "points": round(self.points, 4),
        }


def split_names(raw):
    """"A & B" or "A, B" -> ["A", "B"]. Empty/whitespace-only -> []."""
    return [n.strip() for n in _NAME_SPLIT_RE.split(raw or "") if n.strip()]


def build_player_origin_map(league):
    """lowercased player name -> their registered team id (or AMBIGUOUS)."""
    origin = {}
    for team in league.teams.all():
        for player in team.players.all():
            name = player.name.strip().lower()
            if not name:
                continue
            if name in origin and origin[name] != team.id:
                origin[name] = AMBIGUOUS
            elif name not in origin:
                origin[name] = team.id
    return origin


def _resolve_origin(name, fallback_team_id, origin_map):
    key = (name or "").strip().lower()
    if not key:
        return fallback_team_id
    team_id = origin_map.get(key)
    if not team_id or team_id == AMBIGUOUS:
        return fallback_team_id
    return team_id


def _credit(rows, names, fallback_team_id, total_points, origin_map):
    names = names or [None]
    share = total_points / len(names)
    for name in names:
        origin_id = _resolve_origin(name, fallback_team_id, origin_map) if name else fallback_team_id
        row = rows.get(origin_id)
        if row:
            row.points += share


def compute_ladder(league):
    """Return ladder rows for `league`, sorted highest-ranked first."""
    teams = list(league.teams.prefetch_related("players"))
    settings = league.settings
    origin_map = build_player_origin_map(league)

    rows = {team.id: LadderRow(id=team.id, name=team.name) for team in teams}

    matches = league.matches.select_related("home_team", "away_team").prefetch_related("rubbers")
    for match in matches:
        home = rows.get(match.home_team_id)
        away = rows.get(match.away_team_id)
        if not home or not away:
            continue

        home_pts = 0.0
        away_pts = 0.0
        for rubber in match.rubbers.all():
            hg, ag = rubber.home_games, rubber.away_games
            win_pts = (
                settings.pts_singles_win if rubber.type == "singles" else settings.pts_doubles_win
            )

            home.games_w += hg
            home.games_l += ag
            away.games_w += ag
            away.games_l += hg

            r_home_pts = hg * settings.pts_per_game
            r_away_pts = ag * settings.pts_per_game
            if hg > ag:
                r_home_pts += win_pts
                home.rubbers_w += 1
                away.rubbers_l += 1
            elif ag > hg:
                r_away_pts += win_pts
                away.rubbers_w += 1
                home.rubbers_l += 1

            home_pts += r_home_pts
            away_pts += r_away_pts

            _credit(rows, split_names(rubber.home_players), match.home_team_id, r_home_pts, origin_map)
            _credit(rows, split_names(rubber.away_players), match.away_team_id, r_away_pts, origin_map)

        home.played += 1
        away.played += 1
        if home_pts > away_pts:
            home.wins += 1
            away.losses += 1
        elif away_pts > home_pts:
            away.wins += 1
            home.losses += 1
        else:
            home.draws += 1
            away.draws += 1

    ordered = sorted(
        rows.values(),
        key=lambda r: (-r.points, -(r.games_w - r.games_l), -r.games_w),
    )
    return [row.as_dict() for row in ordered]
