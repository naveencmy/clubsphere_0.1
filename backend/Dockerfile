# ==========================================
# ClubSphere Backend API Gateway - Dockerfile
# Multi-stage, security-hardened production image
# ==========================================

# 1. Dependency Stage
FROM node:20-alpine AS deps
WORKDIR /app

# Install security patches & build dependencies if required
RUN apk add --no-cache libc6-compat

COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts && \
    npm cache clean --force

# 2. Production Runner Stage
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

# Create non-root group and user (UID/GID 1001)
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs

# Copy dependencies with least privilege
COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --chown=nodejs:nodejs package*.json ./
COPY --chown=nodejs:nodejs src ./src
COPY --chown=nodejs:nodejs public ./public

# Ensure upload/images folder exists with proper permissions
RUN mkdir -p /app/public/images && chown -R nodejs:nodejs /app/public

USER nodejs

EXPOSE 4000

# High-frequency container health monitoring
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/health || exit 1

CMD ["node", "src/server.js"]
