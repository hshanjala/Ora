# Ora — Dental Clinic Management

A production-ready dental clinic management system built with Next.js, Supabase, and Tailwind CSS.

## Features
- 📊 Dashboard with live stats
- 📅 Appointment scheduling
- 👥 Patient management
- 🧾 Invoice & billing
- 💸 Expense tracking
- 💊 Prescription management
- 🔔 Subscription billing reminder (bKash & Nagad)
- 🔒 Secure multi-clinic support (each clinic sees only their own data)

## Tech Stack
- **Frontend**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS
- **Hosting**: Vercel

---

## Setup Guide

### Step 1: Set up Supabase

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Click "New Project" and give it a name (e.g. "ora-dental")
3. Wait for the project to be created
4. Go to **SQL Editor** (left sidebar)
5. Click "New Query"
6. Copy the entire contents of `supabase/schema.sql` and paste it
7. Click **Run** — this creates all your tables
8. Go to **Settings → API**
9. Copy your **Project URL** and **anon public key**

### Step 2: Add Environment Variables

In your project folder, create a file called `.env.local` (copy from `.env.local.example`):

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### Step 3: Deploy to Vercel

1. Push this code to GitHub
2. Go to [vercel.com](https://vercel.com) and sign in with GitHub
3. Click "New Project" and select your repository
4. In the **Environment Variables** section, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Click **Deploy**

Your app will be live at `https://your-project.vercel.app`

### Step 4: Configure Supabase Auth

1. In Supabase, go to **Authentication → URL Configuration**
2. Set **Site URL** to your Vercel URL (e.g. `https://ora-dental.vercel.app`)
3. Add your Vercel URL to **Redirect URLs**

---

## Payment Information

When clinics need to renew, they send ৳299 to:
- **bKash**: 01629775202
- **Nagad**: 01799900323

After payment, update their `subscription_end` date in Supabase dashboard.

---

## License
Private — All rights reserved.
