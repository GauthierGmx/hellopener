# --------- Stage 1 : Build --------- 
FROM node:22-alpine@sha256:0a7108bf6c7bf5de370ffb1a3ed6be93d405b43ff159f681a8d18c0e2bc2e402 AS builder

# Define the workspace
WORKDIR /app

# Copy the necessary files for dependencies installation
COPY package*.json ./
RUN npm ci

# Copy the rest of the application code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Compile TypeScript code
RUN npm run build

# --------- Stage 1 : Build --------- 
FROM node:22-alpine@sha256:0a7108bf6c7bf5de370ffb1a3ed6be93d405b43ff159f681a8d18c0e2bc2e402 AS production

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

# Compiled files (TypeScript) from the builder stage
COPY --from=builder /app/dist ./dist

# Non-root user
USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', res => process.exit(res.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "dist/index.js"]