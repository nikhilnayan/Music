import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Your actual Supabase project credentials
const supabaseUrl = 'https://abkcbziqyuhgldgnhypd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFia2NiemlxeXVoZ2xkZ25oeXBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMTM5MDcsImV4cCI6MjA4OTU4OTkwN30.6uQIreKJ4LNj7w8D2NtUUGV-qskfYzMyiIhftou8Eu0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
