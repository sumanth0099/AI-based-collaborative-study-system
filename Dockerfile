# -------------------- FRONTEND BUILD --------------------
    FROM node:20 AS frontend-build

    WORKDIR /app/frontend
    
    COPY frontend/package*.json ./
    RUN npm install
    
    COPY frontend/ ./
    
    # (Optional but SAFE for Docker builds)
    ARG VITE_API_URL
    ARG VITE_SOCKET_URL
    ARG VITE_GOOGLE_AUTH_URL
    
    ENV VITE_API_URL=$VITE_API_URL
    ENV VITE_SOCKET_URL=$VITE_SOCKET_URL
    ENV VITE_GOOGLE_AUTH_URL=$VITE_GOOGLE_AUTH_URL
    
    RUN npm run build
    
    
    # -------------------- BACKEND --------------------
    FROM node:20
    
    WORKDIR /app/backend
    
    COPY backend/package*.json ./
    RUN npm install --omit=dev
    
    COPY backend/ ./
    
    # Copy frontend build into backend public folder
    COPY --from=frontend-build /app/frontend/dist ./public
    
    # Ensure production environment
    ENV NODE_ENV=production
    
    # Expose backend port
    EXPOSE 3000
    
    # Start server
    CMD ["node", "server.js"]