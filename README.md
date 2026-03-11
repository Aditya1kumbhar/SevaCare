# 🪷 SevaCare — Comprehensive Elder Care Platform

A zero-cost, full-stack web application designed for managing old age homes. Built for India's Smart India Hackathon, SevaCare features a modern, calming **Clinical Medical UX**, mobile-first responsiveness, resident profiling, health tracking, gamified wellness activities, and WhatsApp-integrated communications.

## 🎯 Problem Statements Addressed

| # | Problem | Solution |
|---|---------|----------|
| 1 | Manual record-keeping, poor transparency | ERP with resident profiles, inventory, staff scheduling, family portal |
| 2 | Undetected depression & loneliness | Gamified Daily Wellness Routine, Activity Play Mode with scoring |
| 3 | Delayed medical intervention | Emergency WhatsApp `wa.me` links, Action Center medication reminders |
| 4 | Difficult hospital access for elderly | Digital health records, prescription management routing |
| 5 | Lack of engaging content for elderly | Interactive Activity Hub (Yogic/Physical exercises) tailored for seniors |

## 🎨 Clinical Medical UX & Design Setup
The platform was fundamentally redesigned from a brutalist aesthetic to a calming, trust-building **Clinical Medical UX**:
*   **The Lotus of Seva**: A custom-designed gradient logo representing peace, care, and growth.
*   **Pastel Colorways**: Soft blues, emerald greens, and warm ambers to reduce caretaker anxiety.
*   **Gentle Geometry**: Replaced sharp edges with smooth `rounded-2xl` and `rounded-3xl` cards and inputs.
*   **Mobile-First Navigation**: Features a WhatsApp/Instagram-style sticky bottom navigation bar and global top-right Settings/Profile access for rapid on-the-go usage by nurses.

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | Next.js 16 (App Router) | Full-stack React framework |
| **Database** | Supabase (PostgreSQL) | Hosted database + auth + gamification logging |
| **Auth** | Supabase Auth | Session management |
| **Styling** | Tailwind CSS 4 | Custom Clinical UX styling |
| **Icons & Assets**| `lucide-react` | Clean, modern SVG iconography |
| **Hosting** | Vercel | Production deployment |

## 📁 Project Structure

```
frontend/
├── app/
│   ├── page.tsx                          ← Login (Supabase Auth)
│   ├── api/
│   │   ├── log-status/route.ts           ← Log status + generate wa.me URL
│   │   └── auth/signout/route.ts         ← Logout
│   └── dashboard/
│       ├── layout.tsx                    ← Responsive Sidebar + Bottom Mobile Nav
│       ├── page.tsx                      ← Overview (Stats + Alerts)
│       ├── admin/                        ← WhatsApp-style Profile & Settings
│       ├── activity/                     ← Interactive Gamified Exercise Hub
│       │   └── play/                     ← Guided Workout Timer & Logging
│       ├── residents/                    ← Resident list, add, detail, edit
│       ├── inventory/                    ← Medicine & equipment tracking
│       ├── staff/                        ← Staff list + shift scheduling
│       ├── prescriptions/                ← Prescription management
│       ├── family/                       ← Read-only family portal
│       ├── reminders/                    ← Action Center (Upcoming Medications)
│       └── log/[residentId]/             ← Daily status logging form
├── lib/
│   └── supabase/
│       ├── client.ts                     ← Browser Supabase client
│       └── server.ts                     ← Server Supabase client
└── db/
    ├── 001_schema.sql                    ← Core tables
    ├── 002_expanded_schema.sql           ← Extended ERP tables
    ├── 003_liability_schema_patch.sql    ← Advanced risk management fields
    ├── 004_medications_patch.sql         ← Dynamic JSONB medication scheduling
    └── 005_gamification_patch.sql        ← Score and streak tracking
```

## 📱 Key Features

### 👨‍⚕️ Caretaker Dashboard & Workflow
*   **Action Center / Reminders**: Automatically calculates and displays upcoming or overdue medication doses based on resident profiles. Blinking highlights draw immediate attention.
*   **Resident Profiling**: Deep records including life-threatening allergies, mobility status, wandering risk, and communication barriers.
*   **Rapid Status Logging**: Tap-friendly forms (vitals, meals, mood) with instant PDF export and one-click WhatsApp family notification (`wa.me`).

### 🧘‍♀️ Activity & Wellness Hub
*   **Curated Senior Exercises**: 8 low-impact workouts (Seated Yoga, Deep Breathing, Mobility).
*   **Interactive Play Mode**: A focused, distraction-free UI with a large animated SVG countdown timer and auto-advancing step-by-step guidance.
*   **Gamification Engine**: Automatically calculates exercise duration and awards points to the specific Resident's profile, tracking daily streaks to encourage consistent physical activity.

### 🏢 Facility Administration
*   **Inventory**: Track medicine stocks with visual low-threshold warnings.
*   **Staff Scheduling**: Assign morning, afternoon, and night shifts securely.
*   **System Admin**: A clean, minimalist profile page to manage user sessions and configuration.

## 🚀 Quick Start & Deployment

For detailed, step-by-step deployment instructions tailored specifically to Vercel and Supabase, please see the **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** included in this repository.

1. Create a Supabase project and run all SQL files in the `db/` folder in order (001 to 005).
2. Create `frontend/.env.local` with your `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Run `npm install` and `npm run dev` inside the `frontend/` directory.

---

**Built with ❤️ for the Smart India Hackathon**
