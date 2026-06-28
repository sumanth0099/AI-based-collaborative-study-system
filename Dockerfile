# -------------------- FRONTEND BUILD --------------------
    FROM node:20 AS frontend-build

    WORKDIR /app/frontend
    
    COPY frontend/package*.json ./
    RUN npm install
    
    COPY frontend/ .
    RUN npm run build
    
    
    # -------------------- BACKEND --------------------
    FROM node:20
    
    WORKDIR /app/backend
    
    COPY backend/package*.json ./
    RUN npm install
    
    # Copy backend code
    COPY backend/ .
    
    # Copy frontend build into backend
    COPY --from=frontend-build /app/frontend/dist ./public
    
    # Make start script executable
    RUN chmod +x start.sh
    
    EXPOSE 3000
    
    CMD ["./start.sh"]