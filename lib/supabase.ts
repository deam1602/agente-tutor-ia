import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface ChatSession {
  id: string;
  user_email: string;
  title: string;
  created_at?: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: 'user' | 'system' | 'assistant';
  content: string;
  created_at?: string;
}
