FROM node:24-alpine AS deps
WORKDIR /app

COPY frontend/package.json ./package.json
COPY frontend/package-lock.json ./package-lock.json
RUN npm ci

FROM node:24-alpine AS migrator
WORKDIR /app
RUN npm install --no-save --omit=dev mysql2@3.22.5
COPY scripts ./scripts

FROM node:24-alpine AS builder
WORKDIR /app/frontend

ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules /app/node_modules
COPY frontend ./ 
COPY backend /app/backend
RUN npm run build

FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/frontend/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/frontend/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/frontend/.next/static ./.next/static
RUN chmod -R a+rX ./public

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
