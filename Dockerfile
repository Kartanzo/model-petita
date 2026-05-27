FROM node:20-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates fonts-liberation libnss3 libatk-bridge2.0-0 libxkbcommon0 \
    libgbm1 libasound2 libpangocairo-1.0-0 libcups2 libxcomposite1 libxrandr2 \
    libxdamage1 libxfixes3 libdrm2 libx11-xcb1 chromium \
 && rm -rf /var/lib/apt/lists/*
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
RUN npm install --omit=dev=false --no-audit --no-fund

FROM node:20-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates fonts-liberation libnss3 libatk-bridge2.0-0 libxkbcommon0 \
    libgbm1 libasound2 libpangocairo-1.0-0 libcups2 libxcomposite1 libxrandr2 \
    libxdamage1 libxfixes3 libdrm2 libx11-xcb1 chromium \
 && rm -rf /var/lib/apt/lists/*
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
# SQL + migrate (rodam idempotente no boot)
COPY --from=builder /app/db ./db
COPY --from=builder /app/scripts/migrate.js ./scripts/migrate.js
# pg precisa estar disponível no escopo do migrate (standalone já trace-includes pg p/ o app)
COPY --from=deps /app/node_modules/pg ./node_modules/pg
COPY --from=deps /app/node_modules/pg-pool ./node_modules/pg-pool
COPY --from=deps /app/node_modules/pg-connection-string ./node_modules/pg-connection-string
COPY --from=deps /app/node_modules/pg-types ./node_modules/pg-types
COPY --from=deps /app/node_modules/pg-int8 ./node_modules/pg-int8
COPY --from=deps /app/node_modules/pgpass ./node_modules/pgpass
COPY --from=deps /app/node_modules/postgres-array ./node_modules/postgres-array
COPY --from=deps /app/node_modules/postgres-bytea ./node_modules/postgres-bytea
COPY --from=deps /app/node_modules/postgres-date ./node_modules/postgres-date
COPY --from=deps /app/node_modules/postgres-interval ./node_modules/postgres-interval
COPY --from=deps /app/node_modules/split2 ./node_modules/split2
COPY --from=deps /app/node_modules/readable-stream ./node_modules/readable-stream
EXPOSE 3000
CMD ["sh","-c","node scripts/migrate.js && node server.js"]
