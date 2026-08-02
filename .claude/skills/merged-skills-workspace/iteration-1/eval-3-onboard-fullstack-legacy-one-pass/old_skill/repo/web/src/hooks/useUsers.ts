import useSWR from "swr";
import { fetcher } from "../api/client";
export interface User { id: string; name: string; email: string; }
export function useUsers() {
  const { data, error, isLoading } = useSWR<User[]>("/users", fetcher);
  return { users: data, error, isLoading };
}
