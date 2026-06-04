"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async (): Promise<Profile | null> => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      if (error) return null;
      return data as Profile;
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (updates: Partial<Pick<Profile, "username" | "is_public" | "notification_thresholds">>) => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("profiles")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", user.id)
        .select("*")
        .single();
      if (error) throw error;
      return data as Profile;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}

export function useNotificationThresholds() {
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();

  const thresholds: number[] = profile?.notification_thresholds ?? [1, 7];

  const toggle = (days: number) => {
    const current = profile?.notification_thresholds ?? [1, 7];
    const next = current.includes(days)
      ? current.filter((d) => d !== days)
      : [...current, days].sort((a, b) => a - b);
    updateProfile.mutate({ notification_thresholds: next });
  };

  return {
    thresholds,
    isLoading,
    toggle,
  };
}
