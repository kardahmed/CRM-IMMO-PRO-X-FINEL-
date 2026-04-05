"use client";

import { useState, useEffect, useCallback } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { User, Session, AuthChangeEvent } from "@supabase/supabase-js";

interface IAuthState {
  user: User | null;
  session: Session | null;
  isLoaded: boolean;
}

interface IUserMetadata {
  tenantId?: string;
  role?: string;
  workspaceType?: string;
  plan?: string;
  tenantName?: string;
  dbUserId?: string;
  firstName?: string;
  lastName?: string;
}

/**
 * Hook pour accéder à l'utilisateur Supabase côté client.
 * Remplace useUser() de Clerk.
 */
export function useSupabaseAuth() {
  const [state, setState] = useState<IAuthState>({
    user: null,
    session: null,
    isLoaded: false,
  });

  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data }: { data: { session: Session | null } | any }) => {
      const session = data?.session ?? null;
      setState({
        user: session?.user ?? null,
        session,
        isLoaded: true,
      });
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        setState({
          user: session?.user ?? null,
          session,
          isLoaded: true,
        });
      },
    );

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, [supabase.auth]);

  const metadata = (state.user?.user_metadata ?? {}) as IUserMetadata;

  return {
    user: state.user,
    session: state.session,
    isLoaded: state.isLoaded,
    signOut,
    // Convenience accessors matching what Clerk publicMetadata provided
    tenantId: metadata.tenantId ?? null,
    role: metadata.role ?? null,
    workspaceType: metadata.workspaceType ?? null,
    plan: metadata.plan ?? null,
    tenantName: metadata.tenantName ?? null,
    dbUserId: metadata.dbUserId ?? null,
    firstName: metadata.firstName ?? state.user?.user_metadata?.firstName ?? null,
    lastName: metadata.lastName ?? state.user?.user_metadata?.lastName ?? null,
    email: state.user?.email ?? null,
  };
}
