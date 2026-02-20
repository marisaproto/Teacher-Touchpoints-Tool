import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  'https://zawmlrcsqarximgbsjoo.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inphd21scmNzcWFyeGltZ2Jzam9vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2MTQyNTgsImV4cCI6MjA4NzE5MDI1OH0.ka3Vx1yWwDIkTqEM9HHMce58uByx32g_8YUKNfQVthU'
);
