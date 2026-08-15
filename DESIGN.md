# Design System — Hot Shots Tennis League

This file is the authoritative source for visual decisions. Keep the section structure so agents can reason about it.

## Product Context
- **What this is:** Hot Shots Tennis League — a public results/ladder site for KT Academy's tennis league (two divisions: Green Ball, Orange Ball), plus an authenticated admin area for entering results, scheduling draws, and managing teams.
- **Who it's for:** Players/parents/spectators (public read-only views) and club admins (write access to results/draws/teams/settings).
- **Space/industry:** Community sports league site.
- **Project type:** Full-stack web app.

## Scope note
The `frontend/src/pages/tennis/**` feature area uses its **own** scoped design system (`frontend/src/styles/tennis.css`, class-based, everything namespaced under `.tennis-root`) — ported wholesale from the original single-file prototype (`hot-shots-tennis-league-6.html`) rather than rebuilt in MUI. This was a deliberate choice: the visual language is specifically matched to KT Academy's branding and was explicitly called out to preserve exactly. Non-tennis pages (`/login`, 404) still use the MUI theme described below.

## Aesthetic Direction
- **Direction:** Confident sports-club branding — navy + lime (Green Ball) / navy + orange (Orange Ball), bold display type, generous card shadows.
- **Decoration level:** Intentional — court-texture hero background, rank chips, pill badges. No filler beyond that.
- **Mood:** Energetic, clubby, legible at a glance (this is read by people checking a ladder on their phone at courtside).

## Typography (tennis feature)
- **Display/Hero:** `Archivo Black` (headings, hero, wordmark).
- **Body:** `Work Sans` (400/500/600/700).
- **Data/Tables/Scores:** `Roboto Condensed` with `font-variant-numeric: tabular-nums`.
- **Loading:** Google Fonts CDN preconnect + `<link>` in `frontend/index.html`.

## Color (tennis feature — CSS custom properties on `.tennis-root`)
- **Ink (primary dark/nav/headings):** `#122544` (`--ink`), `#0A1A30` (`--ink-dark`), `#1D3760` (`--ink-soft`).
- **Accent — swapped at runtime per division** via `LeagueContext` (`--lime` / `--lime-dark`):
  - Green Ball: `#6FA82C` / `#517D1F`.
  - Orange Ball: `#E2822E` / `#B7631C`.
- **Gold (bonus/secondary accent):** `#E7A93C`.
- **Background:** `#F5F6F1` (`--bg`). **Card:** `#FFFFFF`. **Border:** `#E3E6DC` (`--line`).
- **Text:** `#28303F`. **Muted:** `#727C8C`. **Danger:** `#C0483A`.
- **Radius:** 14px (`--radius`). **Shadow:** `0 6px 24px rgba(10,26,48,0.08)`.

## Rest of the app (MUI theme — `frontend/src/styles/theme.js`)
- **Approach:** Restrained — one accent, neutrals do the heavy lifting.
- **Accent (primary):** `#2563EB`.
- **Background:** `#FFFFFF` (light) / `#0F172A` (dark).
- **Surface:** `#F8FAFC` (light) / `#1E293B` (dark).
- **Primary text:** `#0F172A` (light) / `#F1F5F9` (dark).
- **Muted text:** `#64748B`.
- **Border:** `#E2E8F0` (light) / `#334155` (dark).
- **Semantic:** success `#16A34A` / warning `#D97706` / error `#DC2626` / info `#2563EB`.

## Spacing
- **Base unit:** 8px.
- **Scale:** 4, 8, 12, 16, 20, 24, 32, 40, 48, 64 px.

## Layout
- **Tennis feature max content width:** 1100px (`.tennis-root main`).
- **Rest of app grid:** 12 columns at ≥1200px; 4 columns at ≥600px; 1 column mobile. Max content width 1280px.
- **Border radius:** 4 / 8 / 12 / 9999 px (sm / md / lg / full) outside the tennis feature; 14px inside it.

## Motion
- **Approach:** Minimal-functional — only transitions that aid comprehension.
- **Easing:** enter `cubic-bezier(0, 0, 0.2, 1)` / exit `cubic-bezier(0.4, 0, 1, 1)` / move `cubic-bezier(0.4, 0, 0.2, 1)`.
- **Duration:** micro 75ms / short 150ms / medium 250ms / long 400ms.

## Rules (enforced by CLAUDE.md)
- **Never hardcode colours** outside the tennis feature's CSS custom properties. Elsewhere, use `theme.palette.*`.
- **MUI imports are individual** (`@mui/material/Box`), never barrel — applies outside `pages/tennis/**`, which intentionally doesn't use MUI components.
- **Read this file before changing anything visual.**
