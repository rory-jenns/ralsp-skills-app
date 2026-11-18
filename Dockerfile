# syntax=docker/dockerfile:1.7

FROM node:20-alpine AS base
WORKDIR /app

# Dependencies: this layer is reused until package.json or the lockfile changes.
FROM base AS deps
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci

# Dev: used by docker compose. Source is bind-mounted, so edits hot-reload.
FROM deps AS dev
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]

# Check: lint, test, and build. Run in CI or with `docker build --target check .`
FROM deps AS check
COPY . .
RUN npm run lint && npm run build

# Prod: static files served by nginx, matching the Netlify output.
FROM nginx:alpine AS prod
COPY --from=check /app/dist /usr/share/nginx/html
EXPOSE 80
