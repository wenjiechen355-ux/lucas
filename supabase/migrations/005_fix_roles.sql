-- Fix leader accounts: they are 執委會成員, not 領袖
UPDATE public.profiles SET role = 'member' WHERE email IN (
  'bella.cw96@gmail.com',
  'Lao_SamU@yahoo.com',
  '1260101-2@g.puiching.edu.mo',
  'sweethomeYoko@gmail.com',
  'ellatang0806@gmail.com',
  'zhouhaofeng7@gmail.com',
  'not_owo@hotmail.com'
);
