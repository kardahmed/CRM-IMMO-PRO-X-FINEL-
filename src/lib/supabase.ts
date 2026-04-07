import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

/**
 * Client Supabase côté client (singleton via supabase-browser).
 * Utilisé principalement pour Supabase Realtime (notifications).
 */
export const supabase = createSupabaseBrowserClient();
