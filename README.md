# Skills Web App (Vite + React + TypeScript)

This is a lightweight starter scaffolded for Vite + React + TypeScript + Tailwind CSS, with ESLint, Prettier, and Vitest configured.

Quick start (PowerShell)

Open a PowerShell prompt in the project root and run:

```powershell
npm install
npm run dev
```

Build and preview:

```powershell
npm run build
npm run preview
```

Run lint, format and tests:

```powershell
npm run lint
npm run format
npm run test
npm run typecheck
```

Notes

- This project uses npm. If you prefer pnpm or yarn, adjust accordingly.
- Tailwind is configured via `tailwind.config.cjs` and `postcss.config.cjs`.

## Running the backend and frontend

Run with:

- Start the API server with `npm run dev:api`
- Start the frontend with `npm run dev`
- Or start both together with `npm run dev:all`

## Migration & admin setup

After pulling this repo you should initialize the server DB and seed an admin user (development only):

1. From the `server/` folder run the migration script (creates a backup of `db.json`):

```bash
node migrate-db.js
```

2. Set a password for the seeded admin user. You can either edit `server/db.json` manually and paste a bcrypt hash, or use the helper script:

```bash
# from the server/ folder
node set-admin-password.js my-secure-password
# or via env var
ADMIN_PASSWORD=my-secure-password node set-admin-password.js
```

3. Start the API server:

```bash
npm run dev:api
```

4. Verify login and a protected mutation using the test script:

```bash
# from server/ folder
node test-auth.js admin@example.com my-secure-password
```

Notes:

- The seeded admin created by `migrate-db.js` uses email `admin@example.com`. Always change the password in development and use proper secrets in production. Set `JWT_SECRET` in `server/.env` before running the server in non-development environments.

Additional password notes

- The migration script `server/migrate-db.js` will ensure every user has a bcrypt `password_hash`. If a user is missing `password_hash` the migration sets a default hash so users can log in during development.
- Default password: `password12`. You can override this behavior by setting the `DEFAULT_PASSWORD` environment variable before running the migration, e.g.

```bash
DEFAULT_PASSWORD='my-temp-password' node server/migrate-db.js
```

- If you want to set the same default password for all users explicitly, there's a helper script:

```bash
# from project root
node server/set-default-passwords.js
# (overrides only users missing a password_hash with 'password12')
```

- To set a secure password for the admin user specifically, use `server/set-admin-password.js` (see step 2 above).

- Ensure the server dependencies include `bcryptjs` (install in the `server` folder if needed):

```bash
cd server && npm install bcryptjs
```

Security note: these defaults are for local development convenience only. Do NOT use the `password12` default or any seeded hashes in production.

## Deployment

### Overview

This project uses a two-service deployment:

- **Frontend**: Deployed to Netlify (static hosting)
- **Backend**: Deployed to Render, Railway, or similar (Node.js hosting)

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.
