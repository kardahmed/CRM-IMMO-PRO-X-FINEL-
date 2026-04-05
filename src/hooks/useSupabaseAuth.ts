"use client";

import { useState, useEffect, useCallback } from "react";
import { useSimulation } from "@/context/simulation-context";
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

  const { isSimulating, tenantId: simTenantId, role: simRole, workspaceType: simWorkspaceType, plan: simPlan } = useSimulation();

  const metadata = (state.user?.user_metadata ?? {}) as IUserMetadata;
  const isSuperAdmin = state.user?.email === "contact@sensium-x.com";

  return {
    user: state.user,
    session: state.session,
    isLoaded: state.isLoaded,
    signOut,
    // Convenience accessors matching what Clerk publicMetadata provided
    // Override with simulation if Super Admin and simulation is active
    tenantId: (isSuperAdmin && isSimulating) ? simTenantId : (metadata.tenantId ?? null),
    role: (isSuperAdmin && isSimulating) ? simRole : (metadata.role ?? null),
    workspaceType: (isSuperAdmin && isSimulating) ? simWorkspaceType : (metadata.workspaceType ?? null),
    plan: (isSuperAdmin && isSimulating) ? simPlan : (metadata.plan ?? null),
    tenantName: metadata.tenantName ?? null,
    dbUserId: metadata.dbUserId ?? null,
    firstName: metadata.firstName ?? state.user?.user_metadata?.firstName ?? null,
    lastName: metadata.lastName ?? state.user?.user_metadata?.lastName ?? null,
    email: state.user?.email ?? null,
    isSuperAdmin,
    isSimulating,
  };
}
