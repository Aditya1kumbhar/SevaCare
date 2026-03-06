#!/bin/bash

# SevaCare Vercel Deployment Helper
# Deploy frontend to Vercel + backend to Render

echo "🚀 SevaCare Vercel Deployment Helper"
echo "===================================="
echo ""

# Check if git is clean
if ! git diff-index --quiet HEAD --; then
    echo "⚠️  You have uncommitted changes!"
    echo "Please commit your changes first:"
    echo "  git add ."
    echo "  git commit -m 'Prepare for Vercel deployment'"
    echo "  git push origin main"
    exit 1
fi

echo "✅ All changes committed"
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
    echo "✅ Vercel CLI installed"
fi

echo ""
echo "📋 VERCEL DEPLOYMENT CHECKLIST"
echo "=============================="
echo ""
echo "Step 1: FRONTEND TO VERCEL"
echo "---------------------------"
echo "Command:"
echo "  cd oldagehome-frontend"
echo "  vercel --prod"
echo ""
echo "When prompted:"
echo "  - Authenticate with your GitHub account"
echo "  - Confirm deployment details"
echo "  - Add environment variable:"
echo "    NEXT_PUBLIC_API_URL=https://sevacare-backend.onrender.com/api/v1"
echo ""
echo "Step 2: BACKEND TO RENDER"
echo "------------------------"
echo "If not already deployed:"
echo "  1. Go to https://render.com/dashboard"
echo "  2. Create PostgreSQL database"
echo "  3. Deploy NestJS backend"
echo "  4. Copy backend URL"
echo ""
echo "Step 3: UPDATE ENVIRONMENT VARIABLES"
echo "-----------------------------------"
echo "In Vercel Dashboard:"
echo "  1. Go to sevacare-frontend project"
echo "  2. Settings → Environment Variables"
echo "  3. Update NEXT_PUBLIC_API_URL with your Render backend URL"
echo "  4. Redeploy"
echo ""
echo "Step 4: TEST"
echo "----------"
echo "  1. Open your Vercel frontend URL"
echo "  2. Try signing up/logging in"
echo "  3. Check browser console for any errors"
echo ""
echo "✨ For detailed instructions, see VERCEL_DEPLOYMENT.md"
echo ""
echo "Ready to deploy? Press Enter to continue..."
read

# Start Vercel deployment
cd oldagehome-frontend
echo ""
echo "🚀 Starting deployment..."
echo ""
vercel --prod
