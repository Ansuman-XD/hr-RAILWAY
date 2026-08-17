import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import type {
  DarRecord,
  Employee,
  RewardRecord,
  ServiceEvent,
} from "@/lib/types";

export function useEmployees() {
  return useQuery<Employee[]>({
    queryKey: ["employees"],
    queryFn: apiClient.getEmployees,
    staleTime: 5 * 60 * 1000,
    placeholderData: [],
  });
}

export function useEmployee(id: string) {
  return useQuery<Employee>({
    queryKey: ["employee", id],
    queryFn: () => apiClient.getEmployee(id),
    staleTime: 60000,
    enabled: !!id,
  });
}

export function useDesignations() {
  return useQuery<string[]>({
    queryKey: ["designations"],
    queryFn: apiClient.getDesignations,
    staleTime: 5 * 60000, // 5 mins
    placeholderData: [],
  });
}

export function useBatches() {
  return useQuery<string[]>({
    queryKey: ["batches"],
    queryFn: apiClient.getBatches,
    staleTime: 5 * 60000, // 5 mins
    placeholderData: [],
  });
}

export function useEvents() {
  return useQuery<ServiceEvent[]>({
    queryKey: ["events"],
    queryFn: apiClient.getEvents,
    staleTime: 5 * 60 * 1000,
    placeholderData: [],
  });
}

export function useDar() {
  return useQuery<DarRecord[]>({
    queryKey: ["dar"],
    queryFn: apiClient.getDar,
    staleTime: 60000,
    placeholderData: [],
  });
}

export function useRewards() {
  return useQuery<RewardRecord[]>({
    queryKey: ["rewards"],
    queryFn: apiClient.getRewards,
    staleTime: 60000,
    placeholderData: [],
  });
}

export function useSession() {
  const { data: session, isSuccess, isFetching } = useQuery({
    queryKey: ["session"],
    queryFn: apiClient.getSession,
    staleTime: 5 * 60000,
  });

  return { session: session ?? null, loaded: isSuccess || !isFetching };
}