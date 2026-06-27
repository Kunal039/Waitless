# WaitLess — Appointment Management App

Mobile app for hospital and laboratory appointment booking.
Built with **Expo + React Native (TypeScript)** + **Supabase**.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile | Expo (React Native + TypeScript) |
| Navigation | Expo Router (file-based) |
| Backend / DB | Supabase (PostgreSQL) |
| Auth | Supabase Auth (Phone OTP) |
| UI | React Native Paper + NativeWind |
| Push Notifications | Expo Notifications |

---

## Project Structure

```
WaitLess/
├── app/
│   ├── (auth)/          ← Login, OTP, Register screens
│   ├── (patient)/       ← Patient: Home, Search, Book, Appointments
│   ├── (doctor)/        ← Doctor: Dashboard, Appointments, Availability
│   ├── (lab)/           ← Lab Admin: Dashboard, Bookings, Tests
│   ├── _layout.tsx      ← Root layout
│   └── index.tsx        ← Entry point (redirects based on role)
├── components/          ← Reusable UI components
├── lib/
│   ├── supabase.ts      ← Supabase client
│   └── auth.ts          ← Auth helper functions
├── types/               ← TypeScript interfaces (User, Doctor, Lab, Appointment)
├── constants/
│   └── colors.ts        ← Brand colour palette
├── supabase/
│   ├── schema.sql       ← Database schema — run this first in Supabase
│   └── seed.sql         ← Sample data for development
└── assets/              ← Images, fonts, icons
```

---

## User Roles

| Role | Access |
|------|--------|
| `patient` | Search doctors/labs, book appointments, view own bookings |
| `doctor` | View own appointments, manage availability slots |
| `lab_admin` | Manage lab tests, view bookings, manage slots |

---

## Setup Instructions

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** → run `supabase/schema.sql`
3. Go to **Authentication → Providers** → Enable **Phone** (requires Twilio for SMS)
4. Copy your **Project URL** and **anon public key** from **Settings → API**

### 3. Configure environment

Copy `.env.example` to `.env.local` and fill in your values:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Run the app

```bash
npx expo start
```

Scan the QR code with **Expo Go** app on your phone.

---

## Development Guide

### Adding a new screen

Create a file inside the relevant route group:
```
app/(patient)/new-screen.tsx
```
Expo Router automatically registers it as a route.

### Calling Supabase from a screen

```tsx
import { supabase } from '../../lib/supabase'

const { data, error } = await supabase
  .from('appointments')
  .select('*')
  .eq('patient_id', userId)
```

### Screens marked TODO

All screens currently show placeholder text. Each file has a `// TODO` comment
describing exactly what the screen should show. Dev 2 should implement these
screens based on the provided design files.

---

## Database Tables

| Table | Description |
|-------|-------------|
| `profiles` | All users (patients, doctors, lab admins) |
| `doctors` | Doctor profiles and details |
| `doctor_slots` | Available time slots per doctor |
| `labs` | Lab profiles and details |
| `lab_tests` | Tests offered by each lab |
| `lab_slots` | Available time slots per lab |
| `appointments` | All bookings (doctor + lab) |

---

## Handover Checklist (for client delivery)

- [ ] Create new Supabase project with client's account
- [ ] Run `supabase/schema.sql` in new project
- [ ] Update `.env.local` with new Supabase URL + key
- [ ] Create Expo account under client's email
- [ ] Update `app.json` → `extra.eas.projectId` with new EAS project ID
- [ ] Run `eas build` to generate APK (Android) and IPA (iOS)
- [ ] Submit to Google Play Console and Apple App Store

---

## Node.js Requirement

> This project requires **Node.js v20.19.4 or higher**.
> Update at: https://nodejs.org
