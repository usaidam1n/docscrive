# Build from monorepo root: docker build -f apps/client/Dockerfile .
# Multi-stage build for production optimization
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
COPY apps/client/package.json ./apps/client/
RUN npm ci --workspace=@docscrive/client && npm cache clean --force

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
COPY apps/client ./apps/client
RUN npm ci --workspace=@docscrive/client
WORKDIR /app/apps/client

# Build args for environment variables
ARG NEXT_PUBLIC_API_SECRET
ARG NEXT_PUBLIC_DOCSCRIVE_API
ARG NEXT_PUBLIC_APP_ENV=production

ENV NEXT_PUBLIC_API_SECRET=$NEXT_PUBLIC_API_SECRET
ENV NEXT_PUBLIC_DOCSCRIVE_API=$NEXT_PUBLIC_DOCSCRIVE_API
ENV NEXT_PUBLIC_APP_ENV=$NEXT_PUBLIC_APP_ENV
ENV NODE_ENV=production
ENV DOCKER_BUILD=true

# Build application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy public assets
COPY --from=builder /app/apps/client/public ./public

# Set correct permissions for pre-built application
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/apps/client/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/client/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
