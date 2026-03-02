# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Production stage
FROM node:20-alpine AS production
WORKDIR /app
ARG GIT_SHA=dev
ARG VERSION=unknown
ENV NODE_ENV=production
ENV GIT_SHA=$GIT_SHA
ENV VERSION=$VERSION
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
EXPOSE 3000
USER node
CMD ["node", "dist/server.js"]
