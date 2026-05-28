# syntax=docker/dockerfile:1.6
FROM node:20-alpine

WORKDIR /app

# Install production deps with deterministic lockfile
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy application source
COPY src ./src

ENV NODE_ENV=production \
    PORT=4000

EXPOSE 4000

CMD ["node", "src/index.js"]
