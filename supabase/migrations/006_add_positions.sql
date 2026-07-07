-- Add position column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS position TEXT DEFAULT '';

-- Update positions for executive committee members
UPDATE public.profiles SET position = '主席' WHERE email = 'bella.cw96@gmail.com';
UPDATE public.profiles SET position = '副主席' WHERE email = 'Lao_SamU@yahoo.com';
UPDATE public.profiles SET position = '副主席' WHERE email = 'wenjiechen355@gmail.com';
UPDATE public.profiles SET position = '文書' WHERE email = '1260101-2@g.puiching.edu.mo';
UPDATE public.profiles SET position = '財政' WHERE email = 'sweethomeYoko@gmail.com';
UPDATE public.profiles SET position = '網頁管理' WHERE email = 'ellatang0806@gmail.com';
UPDATE public.profiles SET position = '物資' WHERE email = 'zhouhaofeng7@gmail.com';
UPDATE public.profiles SET position = '攝影' WHERE email = 'not_owo@hotmail.com';
