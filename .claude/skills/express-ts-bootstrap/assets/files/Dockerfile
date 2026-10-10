# Multi-stage build. Written for pnpm (via corepack); for npm use `npm ci` /
# `npm ci --omit=dev` and copy package-lock.json; for bun use oven/bun images.
# --- build stage ---
FROM node:24-alpine AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build

# --- runtime stage ---
FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod
COPY --from=build /app/dist ./dist
USER node
EXPOSE 4000
# No --env-file here: the platform injects real env vars in containers.
CMD ["node", "dist/server.js"]
