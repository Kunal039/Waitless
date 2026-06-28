-- ============================================================
-- WaitLess — Supabase Seed Data
-- ============================================================
--
-- HOW TO SET UP SUPABASE FROM SCRATCH:
--
-- 1. Create a new project at https://supabase.com/dashboard
--    - Choose a region close to India (e.g., ap-south-1 Mumbai)
--    - Note your Project URL and anon/service_role API keys
--
-- 2. Copy your keys into your app:
--    - Open lib/supabase.ts
--    - Set SUPABASE_URL and SUPABASE_ANON_KEY from Project Settings > API
--
-- 3. Run the schema:
--    - Go to Supabase Dashboard > SQL Editor > New Query
--    - Paste the full contents of supabase/schema.sql
--    - Click "Run"
--
-- 4. Run this seed file:
--    - Go to Supabase Dashboard > SQL Editor > New Query
--    - Paste the full contents of this file (supabase/seed.sql)
--    - Click "Run"
--
-- 5. Enable Realtime for queue_tokens:
--    Option A (SQL Editor — run as a separate query):
--      alter publication supabase_realtime add table queue_tokens;
--    Option B (Dashboard):
--      Go to Database > Replication > supabase_realtime publication
--      Toggle ON the queue_tokens table
--
-- 6. Note on doctor user_id:
--    Doctor rows are seeded with user_id = NULL because auth.users
--    cannot be seeded via plain SQL (Supabase Auth manages that table).
--    After a real doctor signs up through the app, link them:
--      UPDATE doctors
--        SET user_id = '<auth-user-uuid>'
--      WHERE id = '<doctor-row-uuid>';
--
-- ============================================================


-- ============================================================
-- CLEAR EXISTING SEED DATA (safe to re-run)
-- ============================================================
delete from queue_tokens;
delete from appointments;
delete from doctor_slots;
delete from doctors;
delete from hospitals;


-- ============================================================
-- 1. HOSPITALS
-- ============================================================
insert into hospitals
  (id, name, address, city, phone, email,
   rating, total_reviews, image_emoji,
   opening_time, closing_time, is_active)
values
  (
    'a1000000-0000-0000-0000-000000000001',
    'Fortis Escorts Heart Institute',
    'Majitha Verka Bypass Road, Amritsar, Punjab 143001',
    'Amritsar',
    '+91-183-5078000',
    'info.amritsar@fortishealthcare.com',
    4.6, 1842, '🏥', '08:00', '20:00', true
  ),
  (
    'a1000000-0000-0000-0000-000000000002',
    'Max Super Speciality Hospital',
    'Press Enclave Road, Saket, New Delhi 110017',
    'Delhi',
    '+91-11-26515050',
    'info.saket@maxhealthcare.com',
    4.7, 3210, '🏨', '08:00', '22:00', true
  ),
  (
    'a1000000-0000-0000-0000-000000000003',
    'Kokilaben Dhirubhai Ambani Hospital',
    'Rao Saheb Achutrao Patwardhan Marg, Four Bungalows, Mumbai 400053',
    'Mumbai',
    '+91-22-30996999',
    'contactus@kokilabenhospital.com',
    4.8, 4590, '🏩', '08:00', '22:00', true
  ),
  (
    'a1000000-0000-0000-0000-000000000004',
    'Shri Guru Ram Dass Jee Institute of Medical Sciences',
    'Vallah, GT Road, Amritsar, Punjab 143501',
    'Amritsar',
    '+91-183-2501068',
    'info@sgrdims.ac.in',
    4.3, 920, '🏦', '09:00', '18:00', true
  );


-- ============================================================
-- 2. DOCTORS
--    All linked to hospital 1 (Fortis Escorts, Amritsar).
--    user_id = NULL — link after doctor signs up via the app.
-- ============================================================
insert into doctors
  (id, user_id, hospital_id, full_name, specialization, qualification,
   experience_years, bio, avatar_emoji,
   consultation_fee, is_available, room_number, shift_start, shift_end)
values
  (
    'b2000000-0000-0000-0000-000000000001',
    null,
    'a1000000-0000-0000-0000-000000000001',
    'Dr. Rajiv Sharma',
    'Cardiologist',
    'MBBS, MD (Cardiology), DM (Cardiology)',
    18,
    'Senior interventional cardiologist specialising in complex coronary interventions and heart failure management.',
    '👨‍⚕️',
    800.00, true, '201', '10:00', '14:00'
  ),
  (
    'b2000000-0000-0000-0000-000000000002',
    null,
    'a1000000-0000-0000-0000-000000000001',
    'Dr. Priya Mehta',
    'General Physician',
    'MBBS, MD (General Medicine)',
    9,
    'Experienced general physician focused on preventive care, lifestyle diseases and acute illness management.',
    '👩‍⚕️',
    400.00, true, '105', '10:00', '14:00'
  ),
  (
    'b2000000-0000-0000-0000-000000000003',
    null,
    'a1000000-0000-0000-0000-000000000001',
    'Dr. Amitabh Singh',
    'Orthopedic Surgeon',
    'MBBS, MS (Orthopaedics), Fellowship Joint Replacement',
    14,
    'Expert in joint replacement surgery, sports injuries, spine disorders and trauma surgery.',
    '🦴',
    600.00, true, '310', '10:00', '14:00'
  ),
  (
    'b2000000-0000-0000-0000-000000000004',
    null,
    'a1000000-0000-0000-0000-000000000001',
    'Dr. Neha Kapoor',
    'Dermatologist',
    'MBBS, MD (Dermatology, Venereology & Leprosy)',
    7,
    'Specialist in medical and cosmetic dermatology, acne, psoriasis, hair loss and skin allergy.',
    '🧑‍⚕️',
    500.00, true, '112', '10:00', '14:00'
  ),
  (
    'b2000000-0000-0000-0000-000000000005',
    null,
    'a1000000-0000-0000-0000-000000000001',
    'Dr. Gurpreet Anand',
    'ENT Specialist',
    'MBBS, MS (ENT), DNB (Otorhinolaryngology)',
    11,
    'Senior ENT surgeon with expertise in endoscopic sinus surgery, cochlear implants and paediatric ENT.',
    '👂',
    450.00, true, '118', '10:00', '14:00'
  );


-- ============================================================
-- 3. DOCTOR SLOTS
--    Today + tomorrow, every 30 min from 10:00 to 14:00
--    = 8 slots per doctor per day = 80 total slots
-- ============================================================
do $$
declare
  v_today    date   := current_date;
  v_tomorrow date   := current_date + interval '1 day';
  v_times    time[] := array[
    '10:00'::time, '10:30'::time,
    '11:00'::time, '11:30'::time,
    '12:00'::time, '12:30'::time,
    '13:00'::time, '13:30'::time
  ];
  v_doctors  uuid[] := array[
    'b2000000-0000-0000-0000-000000000001'::uuid,
    'b2000000-0000-0000-0000-000000000002'::uuid,
    'b2000000-0000-0000-0000-000000000003'::uuid,
    'b2000000-0000-0000-0000-000000000004'::uuid,
    'b2000000-0000-0000-0000-000000000005'::uuid
  ];
  v_doc      uuid;
  v_day      date;
  v_start    time;
begin
  foreach v_doc in array v_doctors loop
    foreach v_day in array array[v_today, v_tomorrow] loop
      foreach v_start in array v_times loop
        insert into doctor_slots
          (id, doctor_id, date, start_time, end_time, is_booked)
        values (
          gen_random_uuid(),
          v_doc,
          v_day,
          v_start,
          v_start + interval '30 minutes',
          false
        )
        on conflict (doctor_id, date, start_time) do nothing;
      end loop;
    end loop;
  end loop;
end $$;


-- ============================================================
-- VERIFY (run individually after seeding):
--   select count(*) from hospitals;      -- expect 4
--   select count(*) from doctors;        -- expect 5
--   select count(*) from doctor_slots;   -- expect 80
-- ============================================================
