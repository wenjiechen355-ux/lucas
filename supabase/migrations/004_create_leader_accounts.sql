-- Create executive committee leader accounts (with auto-profile via trigger)

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
SELECT '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'bella.cw96@gmail.com', '$2b$12$DIR3/QctxfatAWDh.RqN5OVmK371L0irOqqe/FCOyJuoUVDyyqY5a', NOW(), '{"full_name": "黃子芸", "role": "leader"}'::jsonb, NOW(), NOW(), '', '', '', ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'bella.cw96@gmail.com');

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
SELECT '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'Lao_SamU@yahoo.com', '$2b$12$qeBZlNiXLyFNH3R/9018vOegRGW16cuQb6d2YNhqE.BB5qDmg2MiO', NOW(), '{"full_name": "劉芯如", "role": "leader"}'::jsonb, NOW(), NOW(), '', '', '', ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'Lao_SamU@yahoo.com');

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
SELECT '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', '1260101-2@g.puiching.edu.mo', '$2b$12$.1edUCBY6PhPlxEDt/pBoOXjyl2CCIc/7Dc/sMuqh4OWS0Si6vkYu', NOW(), '{"full_name": "周子喬", "role": "leader"}'::jsonb, NOW(), NOW(), '', '', '', ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = '1260101-2@g.puiching.edu.mo');

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
SELECT '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'sweethomeYoko@gmail.com', '$2b$12$yTPeYooyik8PIgcWPq1fGuy36he7IoC/YPMvf7i9OJrVcKmbFOGwq', NOW(), '{"full_name": "李梓柔", "role": "leader"}'::jsonb, NOW(), NOW(), '', '', '', ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'sweethomeYoko@gmail.com');

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
SELECT '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'ellatang0806@gmail.com', '$2b$12$lnLD.Gx08r2.5.u1f971y.ozqqZ5wn1WG..gGRnRFXzthbQeo6WjS', NOW(), '{"full_name": "鄧凱恩", "role": "leader"}'::jsonb, NOW(), NOW(), '', '', '', ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'ellatang0806@gmail.com');

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
SELECT '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'zhouhaofeng7@gmail.com', '$2b$12$UiStYNJY2e3GkMI7X3md6eEyZE7WFdCiJbUeWdGROKC/.kArmeKb2', NOW(), '{"full_name": "周浩楓", "role": "leader"}'::jsonb, NOW(), NOW(), '', '', '', ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'zhouhaofeng7@gmail.com');

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
SELECT '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'not_owo@hotmail.com', '$2b$12$9Bwy9Eg0BU19Q52Lyq/CPONM9/nuhDC2pm2fuSzarjMA.xehqrhxS', NOW(), '{"full_name": "陳子翹", "role": "leader"}'::jsonb, NOW(), NOW(), '', '', '', ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'not_owo@hotmail.com');
