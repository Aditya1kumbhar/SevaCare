#!/bin/bash

# SevaCare Render Deployment Helper
# This script guides you through the deployment process

echo "🚀 SevaCare Render Deployment Helper"
echo "======================================"
echo ""

# Check if git is clean
if ! git diff-index --quiet HEAD --; then
    echo "⚠️  You have uncommitted changes!"
    echo "Please commit your changes first:"
    echo "  git add ."
    echo "  git commit -m 'Prepare for Render deployment'"
    echo "  git push origin main"
    exit 1
fi

echo "✅ All changes committed"
echo ""

# Verify project structure
if [ ! -f "oldagehome-backend/package.json" ] || [ ! -f "oldagehome-frontend/package.json" ]; then
    echo "❌ Error: Missing package.json files"
    exit 1
fi

echo "✅ Project structure verified"
echo ""

# Generate JWT Secret
echo "🔐 Generating JWT Secret..."
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
echo "Your JWT_SECRET: $JWT_SECRET"
echo ""

# Display next steps
echo "📋 Next Steps for Render Deployment:"
echo "===================================="
echo ""
echo "1. Go to https://dashboard.render.com"
echo ""
echo "2. CREATE POSTGRESQL DATABASE:"
echo "   - Click 'New +' → 'PostgreSQL'"
echo "   - Name: sevacare-db"
echo "   - Database: sevacare_db"
echo "   - Copy the Internal Connection String"
echo ""
echo "3. DEPLOY BACKEND SERVICE:"
echo "   - Click 'New +' → 'Web Service'"
echo "   - Connect your GitHub repo"
echo "   - Name: sevacare-backend"
echo "   - Build: cd oldagehome-backend && npm install && npm run build"
echo "   - Start: cd oldagehome-backend && npm run start:prod"
echo ""
echo "   Environment Variables:"
echo "   - NODE_ENV: production"
echo "   - PORT: 3001"
echo "   - DATABASE_URL: (paste PostgreSQL connection string)"
echo "   - JWT_SECRET: $JWT_SECRET"
echo "   - JWT_EXPIRATION: 24h"
echo "   - FRONTEND_URL: (set after frontend deploys)"
echo "   - FIREBASE_PROJECT_ID: sevacare-elderly-care"
echo "   - FIREBASE_PRIVATE_KEY: (from your .env)"
echo "   - FIREBASE_CLIENT_EMAIL: (from your .env)"
echo ""
echo "4. DEPLOY FRONTEND SERVICE:"
echo "   - Click 'New +' → 'Web Service'"
echo "   - Connect your GitHub repo"
echo "   - Name: sevacare-frontend"
echo "   - Build: cd oldagehome-frontend && npm install && npm run build"
echo "   - Start: cd oldagehome-frontend && npm run start"
echo ""
echo "   Environment Variables:"
echo "   - NEXT_PUBLIC_API_URL: https://sevacare-backend.onrender.com/api/v1"
echo ""
echo "5. UPDATE BACKEND CORS:"
echo "   - Set FRONTEND_URL in backend environment vars"
echo "   - Redeploy backend"
echo ""
echo "✨ Document: See RENDER_DEPLOYMENT.md for complete instructions"
echo ""
