# VEXORA — Dark Cosmic / Space Edition

VEXORA is a premium Dark Cosmic command-center application with a Vite/React frontend and Express + SQLite backend. Existing dashboard, users, tasks, assignments, hackathons, notifications, uploads and role-based access flows are preserved.

## IMPORTANT: data persistence

The application is designed so code updates do **not** reset application data. Database initialization is additive (`CREATE TABLE IF NOT EXISTS`) and the seed process only creates missing first-install records. It does not delete legacy users, tasks, assignments, hackathons or notifications and it does not reset an existing admin password.

For Render production, the database and uploads must be stored on a **Persistent Disk**. The included `render.yaml` uses a Starter web service with a 10 GB disk mounted at `/var/data`, then stores data under `/var/data/vexora`.

A code deployment alone cannot make an ephemeral filesystem permanent. Do not use `server/data` as the production data location on a Free service.

## Local PowerShell

```powershell
npm install
npm run dev
```

Production-style local run:

```powershell
npm install
npm run build
npm start
```

Open `http://localhost:5000`.

## Local admin

If no existing admin is present, the first-install defaults are:

- ID: `ARIJIT`
- Password: `ARIJIT18`

You can override these on a fresh database with `BOOTSTRAP_ADMIN_ID`, `BOOTSTRAP_ADMIN_NAME`, `BOOTSTRAP_ADMIN_PASSWORD`, and `BOOTSTRAP_ADMIN_EMAIL`. Existing accounts are never overwritten by bootstrap variables.

## Render deployment

Recommended: create the service from the included `render.yaml` Blueprint. If configuring manually, use:

- Build: `npm install && npm run build`
- Start: `npm run start`
- Plan: Starter (required for the included Persistent Disk)
- Persistent Disk mount: `/var/data`
- `VEXORA_DATA_DIR=/var/data/vexora`
- `VEXORA_UPLOADS_DIR=/var/data/vexora/uploads`
- `JWT_SECRET`: long random secret generated once and then kept stable
- `JWT_EXPIRES_IN=7d`

Do not change `JWT_SECRET` between deployments unless you intentionally want all existing JWT sessions to expire.

## Backups

On startup the server makes a rolling copy of the existing SQLite database in the persistent `backups/` directory and keeps the latest 10 copies. This is a safety layer, not a substitute for independent backups.

## Data safety rules

- Never run `DROP TABLE` against the production database.
- Never delete `/var/data/vexora`.
- Never point production `VEXORA_DATA_DIR` at the deploy/source directory.
- Never change `JWT_SECRET` casually.
- Schema changes must be additive/migrated without destructive resets.
