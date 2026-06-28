-- ============================================================
-- WaitLess — Supabase Database Schema v2
-- Run this in: Supabase Dashboard > SQL Editor > New Query
-- ============================================================

-- Enable realtime for queue
-- Go to Supabase Dashboard > Database > Replication and enable for queue_tokens table

-- 1. USER PROFILES
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null,
  role text not null check (role in ('patient', 'doctor', 'lab_admin', 'reception', 'admin')),
  phone text,
  email text,
  avatar_url text,
  age int,
  gender text check (gender in ('Male', 'Female', 'Other')),
  city text,
  created_at timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "Users can view their own profile"
  on profiles for select using (auth.uid() = id);
create policy "Users can update their own profile"
  on profiles for update using (auth.uid() = id);
create policy "Users can insert their own profile"
  on profiles for insert with check (auth.uid() = id);
-- Allow authenticated users to view any profile (for doctor/reception lookups)
create policy "Authenticated users can view all profiles"
  on profiles for select using (auth.role() = 'authenticated');

-- 2. HOSPITALS
create table public.hospitals (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text not null,
  city text not null,
  phone text not null,
  email text,
  rating numeric(3,2) default 4.0,
  total_reviews int default 0,
  image_emoji text default '🏥',
  opening_time time default '09:00',
  closing_time time default '18:00',
  is_active boolean default true,
  created_at timestamptz default now()
);
alter table public.hospitals enable row level security;
create policy "Hospitals are publicly viewable"
  on hospitals for select using (true);
create policy "Admins can manage hospitals"
  on hospitals for all using (
    auth.uid() in (select id from profiles where role = 'admin')
  );

-- 3. DOCTORS
create table public.doctors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade unique,
  hospital_id uuid references public.hospitals(id) on delete set null,
  full_name text not null,
  specialization text not null,
  qualification text not null,
  experience_years int default 0,
  bio text,
  avatar_emoji text default '👨‍⚕️',
  consultation_fee numeric(10,2) default 0,
  is_available boolean default true,
  room_number text,
  shift_start time default '10:00',
  shift_end time default '18:00',
  created_at timestamptz default now()
);
alter table public.doctors enable row level security;
create policy "Doctors are publicly viewable"
  on doctors for select using (true);
create policy "Doctor can manage their own record"
  on doctors for all using (auth.uid() = user_id);
create policy "Admin can manage all doctors"
  on doctors for all using (
    auth.uid() in (select id from profiles where role in ('admin', 'reception'))
  );

-- 4. DOCTOR SLOTS
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

-- 5. LABS
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

-- 6. LAB TESTS
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

-- 7. LAB SLOTS
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

-- 8. FAMILY MEMBERS
create table public.family_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  full_name text not null,
  age int,
  gender text check (gender in ('Male', 'Female', 'Other')),
  relationship text not null,
  phone text,
  created_at timestamptz default now()
);
alter table public.family_members enable row level security;
create policy "Users can manage their own family members"
  on family_members for all using (auth.uid() = user_id);

-- 9. APPOINTMENTS
create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references public.profiles(id) on delete cascade not null,
  appointment_type text not null check (appointment_type in ('doctor', 'lab')),
  status text not null default 'pending' check (status in ('pending','confirmed','cancelled','completed','no_show')),
  date date not null,
  start_time time not null,
  end_time time not null,
  notes text,
  reason text,
  -- patient info (may differ from profile if booking for family)
  patient_name text,
  patient_age int,
  patient_gender text,
  patient_phone text,
  -- doctor appointment
  hospital_id uuid references public.hospitals(id),
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
create policy "Patients can update their own appointments"
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
create policy "Reception can view all appointments"
  on appointments for select using (
    auth.uid() in (select id from profiles where role in ('reception', 'admin'))
  );
create policy "Reception can update appointments"
  on appointments for update using (
    auth.uid() in (select id from profiles where role in ('reception', 'admin'))
  );
create policy "Reception can insert appointments"
  on appointments for insert with check (
    auth.uid() in (select id from profiles where role in ('reception', 'admin'))
  );

-- 10. QUEUE TOKENS
create table public.queue_tokens (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid references public.appointments(id) on delete cascade not null unique,
  hospital_id uuid references public.hospitals(id) on delete cascade,
  doctor_id uuid references public.doctors(id) on delete cascade,
  token_number int not null,
  date date not null,
  status text not null default 'waiting' check (status in ('waiting', 'in_room', 'completed', 'skipped')),
  called_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz default now()
);
alter table public.queue_tokens enable row level security;
create policy "Anyone authenticated can view queue tokens"
  on queue_tokens for select using (auth.role() = 'authenticated');
create policy "System can insert queue tokens"
  on queue_tokens for insert with check (auth.role() = 'authenticated');
create policy "Reception can update queue tokens"
  on queue_tokens for update using (
    auth.uid() in (select id from profiles where role in ('reception', 'admin', 'doctor'))
  );

-- 11. PAYMENTS
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid references public.appointments(id) on delete cascade not null unique,
  amount numeric(10,2) not null,
  method text not null check (method in ('upi', 'card', 'netbanking', 'wallet', 'cash')),
  status text not null default 'pending' check (status in ('pending', 'paid', 'refunded', 'failed')),
  transaction_id text,
  created_at timestamptz default now()
);
alter table public.payments enable row level security;
create policy "Users can view their own payments"
  on payments for select using (
    auth.uid() = (select patient_id from appointments where id = appointment_id)
  );
create policy "Users can create payments"
  on payments for insert with check (
    auth.uid() = (select patient_id from appointments where id = appointment_id)
  );
create policy "Reception can view all payments"
  on payments for select using (
    auth.uid() in (select id from profiles where role in ('reception', 'admin'))
  );

-- ============================================================
-- ENABLE REALTIME for queue (run separately in Supabase dashboard
-- or via: alter publication supabase_realtime add table queue_tokens;)
-- ============================================================

-- ============================================================
-- USEFUL FUNCTIONS
-- ============================================================

-- Auto-generate token number per doctor per day
create or replace function get_next_token(p_doctor_id uuid, p_date date)
returns int as $$
declare
  next_token int;
begin
  select coalesce(max(token_number), 0) + 1
  into next_token
  from queue_tokens
  where doctor_id = p_doctor_id and date = p_date;
  return next_token;
end;
$$ language plpgsql security definer;
