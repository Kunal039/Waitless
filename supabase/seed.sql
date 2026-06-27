-- ============================================================
-- WaitLess — Sample Seed Data (for development/testing only)
-- Run AFTER schema.sql
-- NOTE: Replace UUIDs with real auth.users UUIDs after creating test accounts
-- ============================================================

-- Sample doctor (replace 'doctor-user-uuid' with real UUID)
-- insert into public.doctors (user_id, full_name, specialization, qualification, experience_years, consultation_fee)
-- values ('doctor-user-uuid', 'Dr. Priya Sharma', 'Cardiologist', 'MBBS, MD', 12, 800);

-- Sample lab (replace 'lab-user-uuid' with real UUID)
-- insert into public.labs (user_id, name, address, city, phone)
-- values ('lab-user-uuid', 'LifeCare Diagnostics', '42 MG Road, Sector 5', 'Delhi', '+91-9876543210');

-- Sample lab tests (replace 'lab-id' with real lab UUID)
-- insert into public.lab_tests (lab_id, name, price, result_time_hours) values
-- ('lab-id', 'Complete Blood Count (CBC)', 350, 12),
-- ('lab-id', 'Blood Sugar (Fasting)', 150, 6),
-- ('lab-id', 'Lipid Profile', 600, 24),
-- ('lab-id', 'Thyroid Profile (T3,T4,TSH)', 800, 24);
