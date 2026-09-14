# Dockerfile — lets anyone run the app locally without installing Node.js.
# Uses a Node.js LTS (Long Term Support) Alpine base for a small image.
FROM node:20-alpine

# App lives in /app inside the container.
WORKDIR /app

# Copy manifests first so Docker can cache the dependency layer.
COPY package*.json ./

# Install only production dependencies (no devDependencies like nodemon).
RUN npm install --omit=dev

# Copy the rest of the source.
COPY . .

# The server listens on 3000.
EXPOSE 3000

# Start the server.
CMD ["node", "server.js"]
