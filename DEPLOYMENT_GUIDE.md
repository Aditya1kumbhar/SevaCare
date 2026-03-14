# 🚀 SevaCare Comprehensive Deployment Guide

This guide is tailored specifically for the `NEWIOLDAGEHOME` folder structure. It contains every minute detail required to successfully deploy the SevaCare platform to the internet using **Vercel** (for the frontend hosting) and **Supabase** (for the backend database).

---

## 📁 Understanding Your Project Structure

Before deploying, it is critical to understand how this specific repository is structured:
*   **Root Folder (`NEWIOLDAGEHOME/`)**: This is the top level of your GitHub repository.
*   **Database Scripts (`db/`)**: Contains all your `.sql` patches. These are run manually in Supabase.
*   **Next.js Application (`frontend/`)**: This is the **actual web application**. All the React code, Tailwind CSS, API routes, and configuration files (`package.json`, `next.config.mjs`) live inside this subdirectory.

Because the app is in `frontend/`, **Vercel needs to be configured to look inside that folder**, not the root!

---

## 🛠️ Phase 1: Supabase Configuration (Backend)

Your Supabase database is already set up and running, but let's ensure it is ready for production.

1. **Verify Database:** Log into [Supabase.com](https://supabase.com). Select your SevaCare project.
2. **Review Tables:** Go to the Table Editor and verify all 10 tables exist (`residents`, `daily_logs`, `health_records`, `inventory`, `staff`, `schedules`, `family_members`, `prescriptions`, `activities`, `emergency_alerts`).
3. **Copy Production Keys:**
   *   Go to **Project Settings** (the gear icon on the left sidebar) > **API**.
   *   Under **Project URL**, copy the `URL`.
   *   Under **Project API Keys**, copy the `anon` `public` key.
   *   *Keep these safely on your clipboard or in a notepad for Phase 3.*

---

## 🐙 Phase 2: Connecting GitHub to Vercel

Since your code is already pushed to `https://github.com/Aditya1kumbhar/SevaCare`, Vercel can pull the code directly from there.

1. Go to **[Vercel.com](https://vercel.com/)** and log in using your GitHub account.
2. If this is your first time, you may need to authorize Vercel to access your GitHub repositories. Grant it access to "All Repositories" or specifically the "SevaCare" repository.
3. On the Vercel Dashboard, click the black **"Add New..."** button in the top right corner and select **"Project"**.
4. In the "Import Git Repository" section, find `Aditya1kumbhar/SevaCare` and click **Import**.

---

## ⚙️ Phase 3: Vercel Project Configuration (Critical Step)

This is the most important part of the deployment. If you skip this, the build will fail immediately.

Once you click "Import", you will be on the **Configure Project** screen. Fill it out exactly as follows:

### 1. Project Name
*   You can name it `sevacare-platform` (or whatever you prefer). This will become part of your free URL (e.g., `sevacare-platform.vercel.app`).

### 2. Framework Preset
*   Vercel should automatically detect this, but ensure it says **Next.js**.

### 3. Root Directory (CRITICAL!)
*   By default, Vercel looks at the root of your repository `.` 
*   Because our Next.js code is in the `frontend` folder, you **MUST** change this.
*   Click the **Edit** button next to Root Directory.
*   Choose the **`frontend`** folder from the list.
*   *(If you forget this, Vercel will try to build the SQL files and fail).*

### 4. Build and Output Settings
*   Leave these as default. Vercel knows how to build Next.js apps natively. (It will run `npm run build`).

### 5. Environment Variables (CRITICAL!)
*   Expand the **Environment Variables** section. Your application will crash on data fetches if it doesn't have secure access to Supabase.
*   Add the two keys you copied from Supabase in Phase 1:
    *   **Variable 1:**
        *   Name: `NEXT_PUBLIC_SUPABASE_URL`
        *   Value: *(Paste your Supabase Project URL here)*
        *   Click **Add**.
    *   **Variable 2:**
        *   Name: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
        *   Value: *(Paste your Supabase anon key here)*
        *   Click **Add**.

---

## 🚀 Phase 4: Deploy and Verify

1. After configuring the Root Directory and Environment Variables, click the large blue **Deploy** button.
2. Vercel will begin the build process:
   *   It clones your GitHub repo.
   *   It navigates into the `/frontend` directory.
   *   It runs `npm install` to get the dependencies.
   *   It runs `npm run build` to compile the React code into optimized HTML/CSS/JS.
   *   It assigns a live SSL certificate and URL.
3. This process takes roughly **60 to 90 seconds**. You will see a terminal scrolling with logs.
4. Once completed, you will see a "Congratulations!" screen with a screenshot of your app.

### Verification Steps on the Live URL
1. Click the provided Vercel URL (e.g., `https://sevacare.vercel.app`).
2. **Auth Check**: Attempt to sign in or sign up a test user. Verify it redirects you to `/dashboard`.
3. **Database Check**: Go to the Residents tab and verify your resident data loads from Supabase.
4. **Mobile Check**: Open the URL on your mobile phone and verify the bottom navigation bar and the new sticky SOS/Settings header appears perfectly.

---

## 🔄 Updating Your Live App (Continuous Integration)

The beauty of Vercel is that it is now permanently linked to your GitHub repository. 

Whenever you want to make a change or build a new feature:
1. Make the change to the code on your local computer.
2. Commit and push the changes:
   ```bash
   git add .
   git commit -m "Updated the dashboard layout"
   git push origin main
   ```
3. Vercel will **automatically** detect the push, rebuild the app in the background, and push the new version live without you having to do anything!
