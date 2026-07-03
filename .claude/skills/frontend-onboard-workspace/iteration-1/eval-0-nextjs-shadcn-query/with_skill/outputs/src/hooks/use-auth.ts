"use client";
import { useState } from "react";
export function useAuth() {
  const [user] = useState<{ id: string; role: string } | null>(null);
  return { user, role: user?.role ?? null };
}
