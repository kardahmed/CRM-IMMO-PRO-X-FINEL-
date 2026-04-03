import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _supabase: SupabaseClient | null = null;

/**
 * Client Supabase (lazy singleton).
 * Ne crash pas si les env vars sont absentes — retourne un client inerte.
 */
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    if (!_supabase) {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!url || !key) {
        // En dev sans Supabase configuré, retourner des stubs silencieux
        if (prop === "channel") return () => ({ on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }), unsubscribe: () => {} });
        if (prop === "removeChannel") return () => {};
        return undefined;
      }

      _supabase = createClient(url, key);
    }

    return (_supabase as unknown as Record<string, unknown>)[prop as string];
  },
});
