# VEXORA Render checklist

## Required for permanent data
1. Use the included `render.yaml`, or manually select a paid Starter web service.
2. Attach a Persistent Disk at `/var/data`.
3. Set `VEXORA_DATA_DIR=/var/data/vexora`.
4. Set `VEXORA_UPLOADS_DIR=/var/data/vexora/uploads`.
5. Keep `JWT_SECRET` stable across every deploy.
6. Do not delete or recreate `/var/data/vexora`.

## First login
If the database is new and no admin exists, the included defaults are:
- ID: `ARIJIT`
- Password: `ARIJIT18`

For a fresh database, you can set bootstrap environment variables before the first deployment. Once an admin exists, bootstrap variables do not overwrite it.

## Safe update test
Create a task and assignment, redeploy the same service, then confirm both remain. If they disappear, stop and inspect the data mount before creating more production data.
