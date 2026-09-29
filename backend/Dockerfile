# --------- Stage 1 : Build --------- 
FROM node:25-alpine@sha256:bdf2cca6fe3dabd014ea60163eca3f0f7015fbd5c7ee1b0e9ccb4ced6eb02ef4 AS builder

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
FROM node:25-alpine@sha256:bdf2cca6fe3dabd014ea60163eca3f0f7015fbd5c7ee1b0e9ccb4ced6eb02ef4 AS production

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

# Compiled files (TypeScript) from the builder stage
COPY --from=builder /app/dist ./dist

# Copying prisma folder needed for migration
COPY --from=builder /app/prisma ./prisma

# Non-root user
USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 3000) + '/api/health', res => process.exit(res.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "dist/index.js"]