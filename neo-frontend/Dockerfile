FROM node:22-alpine AS build
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build both microfrontends
RUN npm run build:all

# Production stage with nginx
FROM nginx:alpine

# Copy shell microfrontend
COPY --from=build /app/dist/shell /usr/share/nginx/html/shell

# Copy dashboard microfrontend
COPY --from=build /app/dist/dashboard /usr/share/nginx/html/dashboard

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
