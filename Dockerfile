# Use official Node.js image as the base
FROM node:20-alpine AS build

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json ./
COPY sizing-tool/package.json ./sizing-tool/

# Install root dependencies (if any)
RUN npm install

# Copy the rest of the app
COPY sizing-tool ./sizing-tool

# Build the SvelteKit app
WORKDIR /app/sizing-tool
RUN npm install && npm run build

# Production image
FROM node:20-alpine AS prod
WORKDIR /app

# Copy built app from build stage
COPY --from=build /app/sizing-tool .

# Expose port (default for Vite/SvelteKit is 3000)
EXPOSE 3000

# Start the app
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0"]
