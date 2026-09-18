# Step 1 : Compilation (Builder)
FROM node:22-alpine AS builder

# Define the workspace
WORKDIR /app

# Only copy the necessary files for dependency installation
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Compile the React/Vite application into static files in the "dist" folder
RUN npm run build

# Step 2 : production server (Nginx)
FROM nginx:alpine

# Security: remove default Nginx configurations
RUN rm -rf /etc/nginx/conf.d/*

# Copy of the custom Nginx configuration
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Copy of the compiled files from step 1 to Nginx's public folder
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]