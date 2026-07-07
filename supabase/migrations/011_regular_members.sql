-- Create regular member accounts
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
SELECT '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'sunnyieong2003@gmail.com', '$2b$12$AGvCZfoH62hjpOysgRikv.b3KsCw2lAo0lK8k/LnbnF0hDMtvPxsa', NOW(), '{"full_name": "楊卓斌", "role": "member"}'::jsonb, NOW(), NOW(), '', '', '', ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'sunnyieong2003@gmail.com');

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
SELECT '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'a958605012@gmail.com', '$2b$12$m4UPncnipxmjCn8cEaL5KuxDkhX4ZELe1b86vMJbpiflsV9XGSSVu', NOW(), '{"full_name": "郭俊廷", "role": "member"}'::jsonb, NOW(), NOW(), '', '', '', ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'a958605012@gmail.com');

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
SELECT '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'heilin0309@gmail.com', '$2b$12$ypGxk8DjTXf5Sqyj1lyUb.Is8EWXgeBTfsU3uNvcLuyWx0XPEMU.e', NOW(), '{"full_name": "連裕熙", "role": "member"}'::jsonb, NOW(), NOW(), '', '', '', ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'heilin0309@gmail.com');

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
SELECT '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'vickychong0604@gmail.com', '$2b$12$1XLayo89PvXAX8XHXnJAmuvDM2v0RaivpXzJ0/4LzqSE6WmeVEiKG', NOW(), '{"full_name": "鍾惠淇", "role": "member"}'::jsonb, NOW(), NOW(), '', '', '', ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'vickychong0604@gmail.com');

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
SELECT '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'phoebeman04@gmail.com', '$2b$12$T2TV26PApHVa9m7Uao7v0OyizZ/fLO.fkpAT3EQNx4FXryM2AA7QC', NOW(), '{"full_name": "文玥晴", "role": "member"}'::jsonb, NOW(), NOW(), '', '', '', ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'phoebeman04@gmail.com');

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
SELECT '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'tonghopui04@gmail.com', '$2b$12$yY1mxwVZz8/s8RPDt712Nu/cAaY9Aj1mbHm13HnOOOnPzXeKADcw2', NOW(), '{"full_name": "湯可蓓", "role": "member"}'::jsonb, NOW(), NOW(), '', '', '', ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'tonghopui04@gmail.com');

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
SELECT '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'cyruswu2005@gmail.com', '$2b$12$smKimeidKYrHucbscIq.VOMDPu4lF6kzTUE0yKEswd4P/YVu2jmZW', NOW(), '{"full_name": "胡巽朗", "role": "member"}'::jsonb, NOW(), NOW(), '', '', '', ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'cyruswu2005@gmail.com');

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
SELECT '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'laohugo82@gmail.com', '$2b$12$bdek1H7Msjth1EFS78ebTuepIjnhE5nrlA8vXrdogZKMCHLJVFBBq', NOW(), '{"full_name": "劉正南", "role": "member"}'::jsonb, NOW(), NOW(), '', '', '', ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'laohugo82@gmail.com');

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
SELECT '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'dwine8245@gmail.com', '$2b$12$rC7GLbkyVw0bosInyVUbXOeVNKYvARanaEXZMZf2tdh80PovyYryG', NOW(), '{"full_name": "張泓軒", "role": "member"}'::jsonb, NOW(), NOW(), '', '', '', ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'dwine8245@gmail.com');

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
SELECT '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'jaydenpang2005@gmail.com', '$2b$12$GooUrIP/VqxATxB21uMLpOl75RTK2qommJvd/bAV3uYg00nLDtJ7u', NOW(), '{"full_name": "彭宇恆", "role": "member"}'::jsonb, NOW(), NOW(), '', '', '', ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'jaydenpang2005@gmail.com');

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
SELECT '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'ericlee51092@gmail.com', '$2b$12$vjgzoxbShACBrxZWhwMh7eYDOYxkyhbzokZb0bCOXV5qqQhD3xboO', NOW(), '{"full_name": "李梓灝", "role": "member"}'::jsonb, NOW(), NOW(), '', '', '', ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'ericlee51092@gmail.com');

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
SELECT '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'lkh060515@gmail.com', '$2b$12$Qy04pksvNKQnf/8zA3x5SuE27dRFB0TNDrv84fPOFZQe9QjcFbfiC', NOW(), '{"full_name": "林珈嫻", "role": "member"}'::jsonb, NOW(), NOW(), '', '', '', ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'lkh060515@gmail.com');

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
SELECT '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'cecilialao128@gmail.com', '$2b$12$rM8tvcnvK4Soq/9pyNFlveyFqB/l6xr/C8brNcvWcV6dst9EDG/fK', NOW(), '{"full_name": "劉思言", "role": "member"}'::jsonb, NOW(), NOW(), '', '', '', ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'cecilialao128@gmail.com');

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
SELECT '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'Chiochenghou@gmail.com', '$2b$12$DFMEFmlkecuLXrclsgW75e2foInxUHGhEAqc6Kcb7rh1uM.d/Y9CK', NOW(), '{"full_name": "趙正顥", "role": "member"}'::jsonb, NOW(), NOW(), '', '', '', ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'Chiochenghou@gmail.com');

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
SELECT '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', '04132008zoie@gmail.com', '$2b$12$wdh1nKCOIgbwkkuW2DVOZ.ZNyMyVniUREu/FuXuW03bn5I1I2UK/W', NOW(), '{"full_name": "黃子懿", "role": "member"}'::jsonb, NOW(), NOW(), '', '', '', ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = '04132008zoie@gmail.com');

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
SELECT '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'vitachong0320@gmail.com', '$2b$12$mrBUYl7kuuxVEC0dCB/5t.U1IduRnAFEpfMOeS995pOOCX5RSvnN2', NOW(), '{"full_name": "鍾惠然", "role": "member"}'::jsonb, NOW(), NOW(), '', '', '', ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'vitachong0320@gmail.com');

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
SELECT '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'wongincheng2007@gmail.com', '$2b$12$KaR4qLnJrzTbBoHTfSVzNuLPVZkALlYJRNdcy7CTIe7fIsPAAdQlK', NOW(), '{"full_name": "黃彥晴", "role": "member"}'::jsonb, NOW(), NOW(), '', '', '', ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'wongincheng2007@gmail.com');

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
SELECT '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'Wilfred.6301.alex@gmail.com', '$2b$12$lkuokQOyzbOFzMaGqoe5ZOzXHZrmN0EV127eUfzQbaJDYjObdhqH2', NOW(), '{"full_name": "陳柏滔", "role": "member"}'::jsonb, NOW(), NOW(), '', '', '', ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'Wilfred.6301.alex@gmail.com');

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
SELECT '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'liuz10796@gmail.com', '$2b$12$ljjZgkn7Y0.EnM3jAhhTveyksbKjyTRHIqu0aHiW1ejaPb3fvpChe', NOW(), '{"full_name": "劉正謙", "role": "member"}'::jsonb, NOW(), NOW(), '', '', '', ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'liuz10796@gmail.com');

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
SELECT '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'isaaccheing0812@gmail.com', '$2b$12$QS.BiXHBaPpWHp3WLeNjWulI.uDnOMf84.C6N/CI4hT9cXV7TtAZ6', NOW(), '{"full_name": "張翀霖", "role": "member"}'::jsonb, NOW(), NOW(), '', '', '', ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'isaaccheing0812@gmail.com');

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
SELECT '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'joe878811@gmail.com', '$2b$12$851dSq/17MvPEMRU.B9mEu3PJEdQvTmSjBMFMI4GDC3XsHYi/Di1O', NOW(), '{"full_name": "阮子浚", "role": "member"}'::jsonb, NOW(), NOW(), '', '', '', ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'joe878811@gmail.com');

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
SELECT '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'bryan320mo@gmail.com', '$2b$12$EYg18iyAjrXPoiuaPoeQC.QcD2LP5zfKmShr2.99ZOujYDhXukL4G', NOW(), '{"full_name": "呂鳳儀", "role": "member"}'::jsonb, NOW(), NOW(), '', '', '', ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'bryan320mo@gmail.com');

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
SELECT '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'tong624hello@gmail.com', '$2b$12$Us9PDpW73n8eOpcXQ59O8usH/VcFMCg/PVKM2X9bQ0.gAhONjFQg.', NOW(), '{"full_name": "吳潁桐", "role": "member"}'::jsonb, NOW(), NOW(), '', '', '', ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'tong624hello@gmail.com');

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
SELECT '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'chglok@gmail.com', '$2b$12$fV4u1/DCChFdpsGgw.2xm.v6B9vRIHdvznQ7s7VMtAixeH.R3gcfe', NOW(), '{"full_name": "陸子謙", "role": "member"}'::jsonb, NOW(), NOW(), '', '', '', ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'chglok@gmail.com');
