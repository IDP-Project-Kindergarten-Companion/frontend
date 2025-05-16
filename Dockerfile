# Stage 1: Build the React application
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock)
COPY package*.json ./
# If using yarn, copy yarn.lock
# COPY yarn.lock ./

# Install dependencies
# If using npm:
RUN npm install
# If using yarn:
# RUN yarn install

# Copy the rest of the application code
COPY . .

# Build the application
# If using npm:
RUN npm run build
# If using yarn:
# RUN yarn build

# Stage 2: Serve the application with Nginx
FROM nginx:1.25-alpine

# Copy the build output from the builder stage
COPY --from=builder /app/build /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
