-- ============================================================
-- WaitLess — Supabase Database Schema
-- Run this in: Supabase Dashboard > SQL Editor > New Query
-- ============================================================

-- 1. USER PROFILES
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null,
  role text not null check (role in ('patient', 'doctor', 'lab_admin')),
  phone text,
  email text,
  avatar_url text,
  created_at timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "Users can view their own profile"
  on profiles for select using (auth.uid() = id);
create policy "Users can update their own profile"
  on profiles for update using (auth.uid() = id);
create policy "Users can insert their own profile"
  on profiles for insert with check (auth.uid() = id);

-- 2. DOCTORS
create table public.doctors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade unique not null,
  full_name text not null,
  specialization text not null,
  qualification text not null,
  experience_years int default 0,
  bio text,
  avatar_url text,
  consultation_fee numeric(10,2) default 0,
  is_available boolean default true,
  created_at timestamptz default now()
);
alter table public.doctors enable row level security;
create policy "Doctors are publicly viewable"
  on doctors for select using (true);
create policy "Doctor can manage their own record"
  on doctors for all using (auth.uid() = user_id);

-- 3. DOCTOR SLOTS
create table public.doctor_slots (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid references public.doctors(id) on delete cascade not null,
  date date not null,
  start_time time not null,
  end_time time not null,
  is_booked boolean default false,
  created_at timestamptz default now(),
  unique(doctor_id, date, start_time)
);
alter table public.doctor_slots enable row level security;
create policy "Doctor slots are publicly viewable"
  on doctor_slots for select using (true);
create policy "Doctor can manage their own slots"
  on doctor_slots for all using (
    auth.uid() = (select user_id from doctors where id = doctor_id)
  );

-- 4. LABS
create table public.labs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade unique not null,
  name text not null,
  address text not null,
  city text not null,
  phone text not null,
  email text,
  opening_time time default '08:00',
  closing_time time default '20:00',
  is_active boolean default true,
  created_at timestamptz default now()
);
alter table public.labs enable row level security;
create policy "Labs are publicly viewable"
  on labs for select using (true);
create policy "Lab admin can manage their own lab"
  on labs for all using (auth.uid() = user_id);

-- 5. LAB TESTS
create table public.lab_tests (
  id uuid primary key default gen_random_uuid(),
  lab_id uuid references public.labs(id) on delete cascade not null,
  name text not null,
  description text,
  price numeric(10,2) not null,
  preparation_info text,
  result_time_hours int default 24,
  is_available boolean default true
);
alter table public.lab_tests enable row level security;
create policy "Lab tests are publicly viewable"
  on lab_tests for select using (true);
create policy "Lab admin can manage their tests"
  on lab_tests for all using (
    auth.uid() = (select user_id from labs where id = lab_id)
  );

-- 6. LAB SLOTS
create table public.lab_slots (
  id uuid primary key default gen_random_uuid(),
  lab_id uuid references public.labs(id) on delete cascade not null,
  date date not null,
  start_time time not null,
  end_time time not null,
  capacity int default 10,
  booked_count int default 0,
  created_at timestamptz default now(),
  unique(lab_id, date, start_time)
);
alter table public.lab_slots enable row level security;
create policy "Lab slots are publicly viewable"
  on lab_slots for select using (true);
create policy "Lab admin can manage their slots"
  on lab_slots for all using (
    auth.uid() = (select user_id from labs where id = lab_id)
  );

-- 7. APPOINTMENTS
create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references public.profiles(id) on delete cascade not null,
  appointment_type text not null check (appointment_type in ('doctor', 'lab')),
  status text not null default 'pending' check (status in ('pending','confirmed','cancelled','completed','no_show')),
  date date not null,
  start_time time not null,
  end_time time not null,
  notes text,
  -- doctor appointment
  doctor_id uuid references public.doctors(id),
  doctor_slot_id uuid references public.doctor_slots(id),
  -- lab appointment
  lab_id uuid references public.labs(id),
  lab_slot_id uuid references public.lab_slots(id),
  lab_test_id uuid references public.lab_tests(id),
  created_at timestamptz default now()
);
alter table public.appointments enable row level security;
create policy "Patients can view their own appointments"
  on appointments for select using (auth.uid() = patient_id);
create policy "Patients can create appointments"
  on appointments for insert with check (auth.uid() = patient_id);
create policy "Patients can cancel their own appointments"
  on appointments for update using (auth.uid() = patient_id);
create policy "Doctors can view appointments for their slots"
  on appointments for select using (
    appointment_type = 'doctor' and
    auth.uid() = (select user_id from doctors where id = doctor_id)
  );
create policy "Doctors can update appointment status"
  on appointments for update using (
    appointment_type = 'doctor' and
    auth.uid() = (select user_id from doctors where id = doctor_id)
  );
create policy "Lab admins can view their lab appointments"
  on appointments for select using (
    appointment_type = 'lab' and
    auth.uid() = (select user_id from labs where id = lab_id)
  );
create policy "Lab admins can update appointment status"
  on appointments for update using (
    appointment_type = 'lab' and
    auth.uid() = (select user_id from labs where id = lab_id)
  );
