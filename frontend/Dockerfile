# ==========================================
# ClubSphere Frontend SPA - Dockerfile
# Multi-stage production build with Nginx Alpine
# ==========================================

# 1. Build Stage
FROM node:20-alpine AS build
WORKDIR /app

# Install dependencies with exact lockfile resolution
COPY package*.json ./
RUN npm ci

# Copy frontend source tree
COPY . .

# Compile optimized static bundle with Vite
RUN npm run build

# 2. Production Web Server Stage
FROM nginx:alpine AS runner

# Remove default boilerplate configuration
RUN rm -rf /etc/nginx/conf.d/*

# Copy production bundle and server directives
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# File permissions hardening
RUN chmod -R 755 /usr/share/nginx/html

EXPOSE 80

# Liveness healthcheck
HEALTHCHECK --interval=20s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
