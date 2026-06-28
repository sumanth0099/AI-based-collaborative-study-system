#!/bin/sh

echo "🚀 Starting backend setup..."

echo "📦 Creating tables..."
node src/scripts/create.table.js

echo "🌱 Seeding database..."
node src/scripts/seed.js

echo "✅ Starting server..."
node server.js