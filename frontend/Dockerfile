# Production Next.js Dockerfile
FROM node:22-alpine AS runner
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

# Set environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Build the Next.js app
RUN npm run build

EXPOSE 3000
CMD ["npm", "run", "start"]
