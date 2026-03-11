# 🏥 SevaCare — Comprehensive Elder Care Platform

A zero-cost, full-stack web application for managing old age homes. Built for India's Smart India Hackathon — covering resident profiling, health tracking, inventory management, staff scheduling, emergency alerts, and family communication via WhatsApp.

## 🎯 Problem Statements Addressed

| # | Problem | Solution |
|---|---------|----------|
| 1 | Manual record-keeping, poor transparency | ERP with resident profiles, inventory, staff scheduling, family portal |
| 2 | Undetected depression & loneliness | Mood tracking, activity gamification with leaderboard |
| 3 | Delayed medical intervention | Emergency alerts with WhatsApp notifications, health trend monitoring |
| 4 | Difficult hospital access for elderly | Prescription management, digital health records |
| 5 | Lack of engaging content for elderly | Gamified activity logging with points system |

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | Next.js 16 (App Router) | Full-stack React framework |
| **Database** | Supabase (PostgreSQL) | Hosted database + auth |
| **Auth** | Supabase Auth | Session management |
| **Styling** | Tailwind CSS 4 + shadcn/ui | UI components |
| **Messaging** | WhatsApp (wa.me links) | Zero-cost family notifications |
| **Hosting** | Vercel | Single deployment |
| **Analytics** | Vercel Analytics | Performance tracking |

> **Zero paid APIs.** WhatsApp messaging uses `wa.me` links — no Twilio or Meta Business API needed.

## 📁 Project Structure

```
frontend/
├── app/
│   ├── page.tsx                          ← Login (Supabase Auth)
│   ├── api/
│   │   ├── log-status/route.ts           ← Log status + generate wa.me URL
│   │   └── auth/signout/route.ts         ← Logout
│   └── dashboard/
│       ├── layout.tsx                    ← Sidebar nav + auth guard
│       ├── page.tsx                      ← Overview (stats + recent logs)
│       ├── residents/                    ← Resident list, add, detail
│       ├── inventory/                    ← Medicine & equipment tracking
│       ├── staff/                        ← Staff list + shift scheduling
│       ├── prescriptions/                ← Prescription management
│       ├── activities/                   ← Gamified activity logging
│       ├── emergency/                    ← Emergency alerts + WhatsApp
│       ├── family/                       ← Read-only family portal
│       └── log/[residentId]/             ← Daily status logging form
├── lib/
│   └── supabase/
│       ├── client.ts                     ← Browser Supabase client
│       └── server.ts                     ← Server Supabase client
└── db/
    ├── 001_schema.sql                    ← Core tables (residents, daily_logs)
    └── 002_expanded_schema.sql           ← Extended tables (8 more)
```

## 📊 Database Schema (10 Tables)

| Table | Purpose |
|-------|---------|
| `residents` | Resident profiles, family contact, dietary needs, allergies |
| `daily_logs` | Daily health status, meal/medication tracking, mood |
| `health_records` | Vitals: BP, heart rate, temperature, SpO₂, weight |
| `inventory` | Medicine & equipment stock with low-threshold alerts |
| `staff` | Staff members with roles (nurse, doctor, volunteer, etc.) |
| `schedules` | Shift management (morning, afternoon, night) |
| `prescriptions` | Active/stopped prescriptions per resident |
| `activities` | Gamified activity logging with points |
| `emergency_alerts` | Emergency alerts with severity and resolution tracking |
| `family_members` | Family member access linked to residents |

All tables have **Row Level Security (RLS)** enabled — only authenticated users can access data.

## 🚀 Quick Start

### 1. Create Supabase Project
- Go to [supabase.com](https://supabase.com) → New Project
- Run `db/001_schema.sql` in SQL Editor
- Run `db/002_expanded_schema.sql` in SQL Editor
- Go to Authentication → Providers → Email → disable "Confirm email"

### 2. Configure Environment
```bash
cd frontend
```

Create `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

### 3. Install & Run
```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) → Sign up → Start managing residents.

## 🚢 Deploy to Vercel

1. Push to GitHub
2. Go to [vercel.com](https://vercel.com) → Add New Project → select repo
3. Set **Root Directory** to `frontend`
4. Add environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
5. Deploy

## 📱 Key Features

### Caretaker Dashboard
- **Dashboard Overview** — Stats cards (residents, logs, staff, alerts, low stock)
- **Resident Profiling** — Full profiles with health records, prescriptions, activity points
- **Daily Status Logging** — Tap-friendly form (health, meal, medication, mood)
- **WhatsApp Notification** — Auto-opens `wa.me` with pre-filled status update

### Operations (PS1)
- **Inventory Management** — Track medicine/equipment, +/- buttons, low stock alerts
- **Staff Scheduling** — Add staff, assign morning/afternoon/night shifts
- **Family Portal** — Read-only dashboard showing all resident updates

### Wellbeing & Engagement (PS2 + PS5)
- **Mood Tracking** — Track mood over daily logs
- **Activity Gamification** — Points per activity, leaderboard with medals 🥇🥈🥉
- **Activity Types** — Exercise, brain games, social, learning, meditation

### Health & Emergency (PS3)
- **Health Records** — BP, heart rate, temperature, SpO₂, blood sugar, weight
- **Emergency Alerts** — Trigger with severity, WhatsApp notify family, resolve

### Medical (PS4)
- **Prescription Management** — Add/stop prescriptions, track dosage & frequency

## 📄 License

Developed for SevaCare Elder Care Management — Smart India Hackathon.

---

**Built with ❤️ using Next.js + Supabase + Tailwind CSS**
