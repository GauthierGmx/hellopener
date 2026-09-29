# --------- Stage 1 : Build --------- 
FROM node:26-alpine@sha256:0b36e8c136b94cd4fcf02188228e76c31ad5872eef3fec8cbd2eee500cfd9e80 AS builder

# Define the workspace
WORKDIR /app

# Copy the necessary files for dependencies installation
COPY package*.json ./
RUN npm ci

# Copy the rest of the application code
COPY . .

# Injecting the VITE_API_URL environment variable into the build process
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Compile the React/Vite application into static files
RUN npm run build

# --------- Stage 2 : Production (Nginx) --------- 
FROM nginx:1.30-alpine@sha256:985220252f3863977e468f611ef118ebd01421289dd86ee1ae99cb068c3bce2b AS production

# Copy the custom Nginx configuration file to the container
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Get the compiled static files from the builder stage and place them in the Nginx html directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Define the permissions for the non-root user nginx
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

USER nginx

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1:8080/ || exit 1

CMD ["nginx", "-g", "daemon off;"]