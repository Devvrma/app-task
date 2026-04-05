# Stage 1: Build (Dependencies install karne ke liye)
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install --production

# Stage 2: Final Image (Sirf kaam ka saaman)
FROM node:18-alpine
WORKDIR /app

# Security: Non-root user create karein
RUN addgroup -S nodegroup && adduser -S nodeuser -G nodegroup

# Builder stage se sirf node_modules uthao
COPY --from=builder /app/node_modules ./node_modules
COPY . .

# User switch karein (Security requirement ✅)
USER nodeuser

EXPOSE 5000
CMD ["node", "server.js"]