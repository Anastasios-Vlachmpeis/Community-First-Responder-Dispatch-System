# Soteria

Soteria is a community-first emergency response dispatch system for Hong Kong. It combines an operator dashboard for live incident coordination with a mobile app for trained volunteer responders, called “allies,” who can reach nearby emergencies before official units arrive.

The product is built around a simple idea: in dense cities, the first few minutes after an emergency often determine the outcome. Ambulances, police, and fire services remain the backbone of the response, but nearby citizens with verified first-aid, medical, rescue, or safety skills may already be within walking distance. Soteria helps dispatch operators identify those people, understand whether they can genuinely arrive sooner than professional responders, and contact them in a structured, accountable workflow.

For each incident, the dashboard shows the emergency location, the estimated arrival times of official services, and a ranked list of suitable allies. Ranking is based on proximity, travel time, and relevant credentials, so operators can prioritize volunteers who are both close enough and appropriately skilled for the emergency type. The responder app supports registration, phone verification, certification selection, availability status, and document upload, forming the foundation for a trusted community responder network.

## Recognition

Soteria won **2nd place in the Smart City track** at the **EuroTech Federation x Hong Kong Talent Engage Hackathon**. Our team was selected from **1,300+ applicants** to participate in the hackathon.

## What's included

### `apps/dashboard` — operator map

<img width="2526" height="1337" alt="Screenshot 2026-06-08 131114" src="https://github.com/user-attachments/assets/b702dfc0-6a3b-4886-943c-6d7839945962" />

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
