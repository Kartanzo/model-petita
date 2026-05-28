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
# SQL + migrate (idempotente, roda no boot)
COPY --from=builder /app/db ./db
COPY --from=builder /app/scripts/migrate.js ./scripts/migrate.js
# pg só pro migrate (o app já tem via standalone trace)
RUN npm init -y >/dev/null 2>&1 && npm install pg --omit=optional --no-audit --no-fund
EXPOSE 3000
CMD ["sh","-c","node scripts/migrate.js || echo '[boot] migrate falhou, subindo server mesmo assim'; PORT=3000 HOSTNAME=0.0.0.0 exec node server.js"]
