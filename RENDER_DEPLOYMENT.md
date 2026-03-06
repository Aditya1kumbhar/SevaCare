# 🚀 Render Deployment Guide for SevaCare

This guide explains how to deploy both the backend and frontend to Render successfully.

## 📋 Prerequisites

1. **Render Account**: Create one at https://render.com
2. **GitHub Repository**: Push your code to GitHub
3. **PostgreSQL Database**: Create a Render PostgreSQL database or use Prisma Cloud
4. **Environment Variables**: Prepare all secrets

---

## 🗂️ Project Structure

Your monorepo has:
```
NEWOLDAGEHOME/
├── render.yaml                  # Render configuration (NEW)
├── package.json                 # Root workspace (NEW)
├── oldagehome-backend/
│   ├── package.json
│   ├── .env
│   └── src/
├── oldagehome-frontend/
│   ├── package.json
│   └── src/
└── .git/
```

---

## 🔧 Step 1: Push Code to GitHub

```bash
git add .
git commit -m "Add Render configuration and monorepo setup"
git push origin main
```

---

## 🗄️ Step 2: Create PostgreSQL Database on Render

1. Go to https://dashboard.render.com
2. Click "New +" → "PostgreSQL"
3. Fill in the details:
   - **Name**: sevacare-db
   - **Database**: sevacare_db
   - **User**: postgres
   - **Region**: Choose closest to you
   - **Version**: PostgreSQL 15+
4. Click "Create Database"
5. **Copy the connection string** from the Internal Database URL (you'll need this)

---

## 🔧 Step 3: Deploy Backend Service

### Create Backend Service:

1. Go to Dashboard → "New +" → "Web Service"
2. Connect your GitHub repository
3. Fill in the details:
   - **Name**: sevacare-backend
   - **Environment**: Node
   - **Build Command**: `cd oldagehome-backend && npm install && npm run build`
   - **Start Command**: `cd oldagehome-backend && npm run start:prod`
   - **Plan**: Free or Paid (your choice)

### Add Environment Variables:

In the "Environment" section, add these variables:

```
NODE_ENV=production
PORT=3001
JWT_SECRET=<generate-random-32-char-string>
JWT_EXPIRATION=24h
DATABASE_URL=<paste-your-postgres-connection-string>
FRONTEND_URL=https://sevacare-frontend.onrender.com
FIREBASE_PROJECT_ID=sevacare-elderly-care
FIREBASE_PRIVATE_KEY=<paste-from-your-.env>
FIREBASE_CLIENT_EMAIL=<paste-from-your-.env>
```

**To generate JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

4. Click "Create Web Service"
5. Wait for deployment to complete
6. **Copy the backend URL** (e.g., https://sevacare-backend.onrender.com)

---

## 🎨 Step 4: Deploy Frontend Service

### Create Frontend Service:

1. Go to Dashboard → "New +" → "Web Service"
2. Connect your GitHub repository (same)
3. Fill in the details:
   - **Name**: sevacare-frontend
   - **Environment**: Node
   - **Build Command**: `cd oldagehome-frontend && npm install && npm run build`
   - **Start Command**: `cd oldagehome-frontend && npm run start`
   - **Plan**: Free or Paid

### Add Environment Variables:

```
NEXT_PUBLIC_API_URL=https://sevacare-backend.onrender.com/api/v1
```

4. Click "Create Web Service"
5. Wait for deployment to complete

---

## ✅ Step 5: Update Backend CORS Settings

After both services are deployed:

1. Go to Backend service settings
2. Update the environment variable:
   ```
   FRONTEND_URL=https://sevacare-frontend.onrender.com
   ```
3. Click "Deploy"

---

## 🧪 Step 6: Test Your Deployment

### Test Backend API:

```bash
# Sign up
curl -X POST https://sevacare-backend.onrender.com/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Test User",
    "email":"test@sevacare.in",
    "phone":"+919876543210",
    "password":"Test@123"
  }'

# You should get a response with a token
```

### Test Frontend:

1. Open https://sevacare-frontend.onrender.com
2. Try signing up with the credentials:
   - Email: test@sevacare.in
   - Password: Test@123
   - Name: Test User
   - Phone: +919876543210

---

## 🔥 Common Issues & Fixes

### Issue 1: "Module not found" during build

**Solution:**
```bash
# Make sure package.json exists in the correct directory
ls -la oldagehome-backend/package.json
ls -la oldagehome-frontend/package.json
```

### Issue 2: Database Connection Failed

**Check:**
- DATABASE_URL is correctly set in environment variables
- PostgreSQL database is running
- Credentials are correct

**Test:**
```bash
psql <your-connection-string>
```

### Issue 3: Frontend Can't Connect to Backend

**Solution:**
- Update `NEXT_PUBLIC_API_URL` to match your backend URL
- Restart the frontend service
- Check browser Network tab for CORS errors

### Issue 4: Build Fails with "Cannot find module"

**Solution:**
Clear cache and redeploy:
1. Go to service settings
2. Click "Clear Build Cache"
3. Redeploy

### Issue 5: PORT Already in Use (on Render)

**Solution:**
Render automatically assigns a PORT. Don't manually set it to 3001.
Your code should use `process.env.PORT` (which your code already does ✅)

---

## 📊 Environment Variables Checklist

### Backend (.env)
- [ ] DATABASE_URL (from Render PostgreSQL)
- [ ] NODE_ENV=production
- [ ] PORT (let Render assign)
- [ ] JWT_SECRET (32+ random chars)
- [ ] JWT_EXPIRATION=24h
- [ ] FRONTEND_URL (your frontend URL)
- [ ] FIREBASE_PROJECT_ID
- [ ] FIREBASE_PRIVATE_KEY
- [ ] FIREBASE_CLIENT_EMAIL

### Frontend (.env.local)
- [ ] NEXT_PUBLIC_API_URL (your backend URL with /api/v1)

---

## 🔐 Security Checklist

✅ Change JWT_SECRET from default
✅ Use strong database password
✅ Enable HTTPS (Render does this by default)
✅ Don't expose secrets in code
✅ Use environment variables for all sensitive data
✅ Set NODE_ENV=production

---

## 📈 Performance Tips

1. **Use Paid Plans** for production (better uptime)
2. **Enable Auto-Deploy** in GitHub integration
3. **Monitor Logs**: Check "Logs" tab for errors
4. **Database**: Use Render PostgreSQL or Prisma Cloud for better performance
5. **Caching**: Add Redis for session caching (optional)

---

## 🆘 Still Having Issues?

Check these:
1. Go to your service's **"Events"** tab to see deployment logs
2. Check the **"Logs"** tab for runtime errors
3. Compare your .env with `.env.example`
4. Restart the service (click "Manual Deploy")
5. Clear build cache and redeploy

---

## 📚 Useful Links

- **Render Docs**: https://render.com/docs
- **Render Dashboard**: https://dashboard.render.com
- **NestJS Deployment**: https://docs.nestjs.com/deployment
- **Next.js Deployment**: https://nextjs.org/docs/deployment

---

**Happy Deploying! 🚀**
