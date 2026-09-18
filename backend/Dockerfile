FROM node:22-alpine

# Define the workspace
WORKDIR /app

# Define the ownership of the /app directory to the non-root user 'node'
RUN chown -R node:node /app

# Copy dependencies manifests and Prisma files with ownership set to 'node' user
COPY --chown=node:node package*.json ./
COPY --chown=node:node prisma ./prisma/
COPY --chown=node:node prisma.config.ts ./

# Installing dependencies
RUN npm install

# Generate the Prisma client
RUN npx prisma generate

# Copy the rest of the source code
COPY --chown=node:node . .

# Security: switch to a non-root user (default in the node image)
USER node

# Expose the port the app runs on (change it if your Express app listens on a different port)
EXPOSE 3000

# Startup command
CMD ["npm", "start"]