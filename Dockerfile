# Use Node.js 20 as base image
FROM node:20-slim

# Install system dependencies required for Puppeteer/Chrome
RUN apt-get update && apt-get install -y \
    wget \
    ca-certificates \
    fonts-liberation \
    git \
    chromium \
    chromium-sandbox \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    lsb-release \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json bun.lock* ./

# Install dependencies (skip Puppeteer Chromium download, we'll use system Chromium)
ENV PUPPETEER_SKIP_DOWNLOAD=true
RUN npm install -g bun && \
    bun install --frozen-lockfile

# Copy Nx configuration and workspace files
COPY nx.json tsconfig.base.json workspace.json ./
COPY babel.config.json ./
COPY jest.config.ts jest.preset.ts ./

# Copy all source files
COPY apps/ ./apps/
COPY libs/ ./libs/
COPY tools/ ./tools/

# Create client-e2e project.json (needed for Nx workspace config, even though we don't build it)
RUN mkdir -p ./apps/client-e2e && \
    cat > ./apps/client-e2e/project.json << 'EOF'
{
"sourceRoot": "apps/client-e2e/src",
"projectType": "application",
"targets": {
"e2e": {
"executor": "@nrwl/cypress:cypress",
"options": {
"cypressConfig": "apps/client-e2e/cypress.json",
"devServerTarget": "client:serve:development"
},
"configurations": {
"production": {
"devServerTarget": "client:serve:production"
}
}
},
"lint": {
"executor": "@nrwl/linter:eslint",
"outputs": ["{options.outputFile}"],
"options": {
"lintFilePatterns": ["apps/client-e2e/**/*.{js,ts}"]
}
}
},
"tags": [],
"implicitDependencies": ["client"]
}
EOF

# Build the application (both client and server)
RUN npx nx run-many --target=build --projects=client,server --configuration=production

# Set environment variables
ENV NODE_ENV=production
ENV PORT=80
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:80/ || exit 1

# Start the server
CMD ["node", "dist/apps/server/main.js"]
