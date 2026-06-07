# Reach / Soteria

Emergency response tooling for Hong Kong: an operator dashboard for dispatching incidents and a mobile app for volunteer responders (“allies”).

## What's included

### `apps/dashboard` — operator map

Live Mapbox map for emergency operators.

- Incident list with seed data and operator-created incidents
- Emergency service units (ambulance, police, fire) with routed paths and ETAs
- Ally recommender — ranks nearby volunteers by distance and credentials
- Call workflow UI to contact allies and record accept/decline
- Route overlays, map bounds locked to Hong Kong

**Requires:** `VITE_MAPBOX_TOKEN` in `apps/dashboard/.env`

### `apps/soteria` — volunteer mobile app

PWA for people who want to register as nearby responders.

- Phone signup with SMS verification (Twilio)
- Skill/certification selection and profile
- Availability toggle (on/off for a set duration)
- Cert document upload (stored locally for now)

**Requires:** Twilio credentials in `apps/soteria/.env` (see `.env.example`). Without them, OTP SMS won't send — use demo code `123456` to verify locally.

## Monorepo layout

```
apps/
  dashboard/   Operator dispatch map (React + Mapbox)
  soteria/     Volunteer registration app (React + Express OTP server)
HONESTY.md     Hackathon disclosure — what's real vs mocked
```

## Getting started

```bash
pnpm install

# Dashboard
cd apps/dashboard
pnpm dev

# Soteria (web + OTP API)
cd apps/soteria
pnpm dev
```

Root scripts:

```bash
pnpm typecheck   # both apps
pnpm lint        # biome
```

## Notes

- Incident data is **mocked** for the demo. Production would ingest live feeds from the governmental agency's dispatch pipeline. See [HONESTY.md](./HONESTY.md) for full disclosure.
- The dashboard ally pool is synthetic. Soteria registrations are not yet synced to the dashboard.
