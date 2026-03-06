# 🚀 Vercel Deployment Guide for SevaCare

Complete step-by-step guide to deploy your SevaCare application to Vercel.

---

## 📋 Architecture Options

### Option A: Frontend on Vercel + Backend on Render (RECOMMENDED) ✅
- **Frontend**: Next.js deployed to Vercel
- **Backend**: NestJS deployed to Render
- ✅ Best performance
- ✅ Easy to manage
- ✅ Free tier available

### Option B: Frontend on Vercel Only
- Deploy only the frontend
- Suitable if backend is already deployed elsewhere

### Option C: Full Stack on Vercel (Advanced)
- Convert NestJS to Serverless Functions
- More complex setup

**This guide uses Option A (Recommended)**

---

## 🔥 QUICK START - Deploy Frontend to Vercel in 5 Minutes

### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

### Step 2: Login to Vercel
```bash
vercel login
```
This opens a browser - authenticate with your GitHub/Google account

### Step 3: Deploy Frontend
```bash
cd oldagehome-frontend
vercel --prod
```

### Step 4: Set Environment Variables

When prompted, add:
```
NEXT_PUBLIC_API_URL=https://sevacare-backend.onrender.com/api/v1
```

That's it! Your frontend is live! 🎉

---

## 📚 DETAILED DEPLOYMENT STEPS

### Step 1: Prepare Your Code

Ensure both apps have correct `package.json`:

**Backend** (`oldagehome-backend/package.json`):
```json
{
  "name": "sevacare-backend",
  "version": "1.0.0",
  "scripts": {
    "start:prod": "node dist/main"
  }
}
```

**Frontend** (`oldagehome-frontend/package.json`):
```json
{
  "name": "sevacare-frontend",
  "version": "1.0.0",
  "scripts": {
    "build": "next build",
    "start": "next start"
  }
}
```

### Step 2: Create Vercel Account

1. Go to https://vercel.com
2. Click **"Sign Up"**
3. Choose **"Continue with GitHub"**
4. Authorize Vercel to access your GitHub account

### Step 3: Deploy Frontend to Vercel

#### Option A: Using Vercel CLI (Fastest)

```bash
# Navigate to frontend
cd oldagehome-frontend

# Deploy
vercel --prod
```

You'll be asked:
```
? Set up and deploy "oldagehome-frontend"? [Y/n] y
? Which scope do you want to deploy to? (your-github-username)
? Link to existing project? [y/N] n
? What's your project's name? sevacare-frontend
? In which directory is your code located? ./
? Want to modify these settings? [y/N] n
```

After deployment completes, you'll get a URL:
```
✓ Production: https://sevacare-frontend.vercel.app
```

#### Option B: Using Vercel Dashboard

1. Go to https://vercel.com/dashboard
2. Click **"Add New..."** → **"Project"**
3. Select your GitHub repository
4. Fill in:
   - **Project Name**: sevacare-frontend
   - **Framework Preset**: Next.js
   - **Root Directory**: ./oldagehome-frontend
5. Click **"Deploy"**

### Step 4: Configure Environment Variables

After deployment:

1. Go to **Project Settings** → **Environment Variables**
2. Add:
   ```
   NEXT_PUBLIC_API_URL = https://sevacare-backend.onrender.com/api/v1
   ```
3. Click **"Save"**
4. Redeploy (click **"Redeploy"** button)

---

## 🔧 Deploy Backend to Render (If Not Already Done)

Since Vercel doesn't support long-running Node.js servers, deploy NestJS backend to Render:

### Step 1: Create PostgreSQL Database

1. Go to https://render.com/dashboard
2. Click **"New +"** → **"PostgreSQL"**
3. Fill in:
   - **Name**: sevacare-db
   - **Database**: sevacare_db
4. Click **"Create Database"**
5. Copy the **Internal Database URL**

### Step 2: Deploy Backend

1. Go to https://render.com/dashboard
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repo
4. Fill in:
   - **Name**: sevacare-backend
   - **Environment**: Node
   - **Build Command**:
     ```
     cd oldagehome-backend && npm install && npm run build
     ```
   - **Start Command**:
     ```
     cd oldagehome-backend && npm run start:prod
     ```
   - **Plan**: Free or Paid

### Step 3: Add Environment Variables

In Render, go to **Environment** and add:

```
DATABASE_URL=(Your PostgreSQL connection string)
NODE_ENV=production
JWT_SECRET=(Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_EXPIRATION=24h
FRONTEND_URL=https://sevacare-frontend.vercel.app
FIREBASE_PROJECT_ID=sevacare-elderly-care
FIREBASE_PRIVATE_KEY=(From your .env)
FIREBASE_CLIENT_EMAIL=(From your .env)
```

4. Click **"Create Web Service"**
5. Wait for deployment (~10 minutes)
6. Copy your backend URL: `https://sevacare-backend.onrender.com`

### Step 4: Update Frontend Environment Variable

Update Vercel:
1. Go to https://vercel.com/dashboard
2. Select **sevacare-frontend**
3. **Settings** → **Environment Variables**
4. Update:
   ```
   NEXT_PUBLIC_API_URL = https://sevacare-backend.onrender.com/api/v1
   ```
5. Click **Redeploy**

---

## ✅ Verify Deployment

### Test Frontend
1. Open: https://sevacare-frontend.vercel.app
2. Try signing up with:
   - Email: test@sevacare.in
   - Password: Test@123
   - Name: Test User
   - Phone: +919876543210

### Test Backend API
```bash
curl -X POST https://sevacare-backend.onrender.com/api/v1/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@sevacare.in",
    "password": "Test@123"
  }'
```

You should get a response with a `token`.

---

## 🎯 Environment Variables Summary

### Frontend (Vercel)
```
NEXT_PUBLIC_API_URL=https://sevacare-backend.onrender.com/api/v1
```

### Backend (Render)
```
DATABASE_URL=postgresql://...
NODE_ENV=production
PORT=3001
JWT_SECRET=<random-32-char>
JWT_EXPIRATION=24h
FRONTEND_URL=https://sevacare-frontend.vercel.app
FIREBASE_PROJECT_ID=sevacare-elderly-care
FIREBASE_PRIVATE_KEY=<from-.env>
FIREBASE_CLIENT_EMAIL=<from-.env>
```

---

## 🚀 Deployment URLs After Setup

| Service | URL |
|---------|-----|
| **Frontend** | https://sevacare-frontend.vercel.app |
| **Backend API** | https://sevacare-backend.onrender.com/api/v1 |
| **Database** | PostgreSQL on Render |

---

## 🔐 Security Checklist

- ✅ Change JWT_SECRET from default
- ✅ Never commit `.env` files
- ✅ Use environment variables for all secrets
- ✅ Enable HTTPS (both platforms do by default)
- ✅ Set NODE_ENV=production
- ✅ Use strong database passwords
- ✅ Restrict CORS to your frontend domain

---

## 🛠️ Troubleshooting

### Frontend Build Fails on Vercel

**Error**: `Cannot find module 'next'`

**Solution**:
```bash
# In oldagehome-frontend/
npm install
vercel --prod --debug
```

### Frontend Can't Connect to Backend

**Error**: `Failed to fetch from API`

**Check**:
1. Backend is running on Render
2. `NEXT_PUBLIC_API_URL` is correct
3. CORS is enabled on backend
4. Check browser Network tab for 403/CORS errors

**Fix**:
```bash
# Update Vercel env var
vercel env add NEXT_PUBLIC_API_URL
# Enter: https://sevacare-backend.onrender.com/api/v1

# Redeploy
vercel --prod
```

### Build Takes Too Long

**Solution**:
- Increase Vercel plan to Pro
- Optimize dependencies (`npm list` to find duplicates)
- Remove unused packages

### "No configuration found for project"

**Solution**:
```bash
# Make sure you're in the frontend directory
cd oldagehome-frontend
vercel --prod
```

---

## 📊 Monitoring & Logs

### View Deployment Logs
```bash
vercel logs --prod
```

### Real-time Logs
```bash
vercel logs -f
```

### View in Dashboard
1. Go to https://vercel.com/dashboard
2. Click **sevacare-frontend**
3. **Deployments** tab

---

## 💡 Pro Tips

1. **Auto-Deploy on Push**: Vercel auto-deploys on every push to `main` branch
2. **Preview Deployments**: Every pull request gets a preview URL
3. **Rollback**: Go to Deployments tab, click the deployment, click "Redeploy"
4. **Custom Domain**: Go to Settings → Domains to add your own domain
5. **Analytics**: Vercel provides free analytics for your site

---

## 📈 Performance Optimization

Already configured in your `next.config.mjs`:
```javascript
{
  typescript: { ignoreBuildErrors: true },
  images: { unoptimized: true }
}
```

This means:
- ✅ TypeScript errors won't block deployment
- ✅ Images optimized for production
- ✅ Vercel CDN automatically caches your assets

---

## 🎓 Next Steps

1. ✅ Deploy frontend to Vercel (5 minutes)
2. ✅ Deploy backend to Render (if not done)
3. ✅ Update environment variables
4. ✅ Test the application
5. 📊 Monitor logs and performance
6. 🎯 Add custom domain (optional)

---

## 📞 Support

- **Vercel Docs**: https://vercel.com/docs
- **Render Docs**: https://render.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **NestJS Docs**: https://docs.nestjs.com

---

**You're ready to deploy! 🚀**
