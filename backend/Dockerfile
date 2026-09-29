# --------- Stage 1 : Build --------- 
FROM node:26-alpine@sha256:0b36e8c136b94cd4fcf02188228e76c31ad5872eef3fec8cbd2eee500cfd9e80 AS builder

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
FROM node:26-alpine@sha256:0b36e8c136b94cd4fcf02188228e76c31ad5872eef3fec8cbd2eee500cfd9e80 AS production

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

# Compiled files (TypeScript) from the builder stage
COPY --from=builder /app/dist ./dist

# Copying prisma folder needed for migration
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

# Non-root user
USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 3000) + '/api/health', res => process.exit(res.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "dist/index.js"]