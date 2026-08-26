# Production image for the MedAssist API.
# No build step needed (plain Node/Express), so a single stage is enough —
# just install production deps and run.
FROM node:20-alpine

WORKDIR /app

# Install dependencies first so this layer is cached unless package.json changes
COPY package*.json ./
RUN npm install --omit=dev

# Copy the rest of the source
COPY . .

# Multer writes here; created up front so the volume mount (see
# docker-compose.yml) has somewhere to attach even before the first upload
RUN mkdir -p uploads/prescriptions

# Runs as a non-root user for defense in depth
RUN addgroup -S medassist && adduser -S medassist -G medassist
RUN chown -R medassist:medassist /app
USER medassist

EXPOSE 5000

# Basic container-level healthcheck hitting the existing /api/health route
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://localhost:5000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
