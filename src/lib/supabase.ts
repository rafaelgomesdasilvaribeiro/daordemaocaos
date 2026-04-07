import { createClient } from '@supabase/supabase-js';

// Usando as credenciais locais recuperadas do MCP para o projeto "Produtividade 10x"
const supabaseUrl = 'https://vozxmxenpnnlfwvkkdew.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZvenhteGVucG5ubGZ3dmtrZGV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0ODY3MjcsImV4cCI6MjA5MDA2MjcyN30.8FN9hJ9A5ZgCX8UeYf_4nU1zsm9E5qF66L4wZmdLzjw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
