import type { Employee, ServiceEvent, DarRecord, RewardRecord, Session, Credential } from "./types";

const API_URL = import.meta.env["VITE_API_URL"] ?? "http://localhost:5000/api";

async function fetcher(endpoint: string, options?: RequestInit) {
  const res = await fetch(`${API_URL}${endpoint}`, {
    credentials: "include",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!res.ok) {
    throw new Error(`API Error: ${res.statusText}`);
  }
  return res.json();
}

export const apiClient = {
  getEmployees: () => fetcher('/employees') as Promise<Employee[]>,
  getEmployee: (id: string) => fetcher(`/employees/${id}`) as Promise<Employee>,
  createEmployee: (data: Employee) => fetcher('/employees', { method: 'POST', body: JSON.stringify(data) }),
  updateEmployee: (id: string, data: Employee) => fetcher(`/employees/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  uploadPhoto: async (id: string, file: File) => {
    const formData = new FormData();
    formData.append('photo', file);
    const res = await fetch(`${API_URL}/employees/${id}/photo`, {
      method: "POST",
      body: formData,
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to upload photo");
    return res.json();
  },
  bulkImport: (data: { employees: Employee[], batches: string[], designations: string[] }) => fetcher('/employees/bulk', { method: 'POST', body: JSON.stringify(data) }),
  
  getDesignations: () => fetcher('/designations') as Promise<string[]>,
  createDesignation: (name: string) => fetcher('/designations', { method: 'POST', body: JSON.stringify({ name }) }),
  updateDesignation: (oldName: string, name: string) => fetcher(`/designations/${oldName}`, { method: 'PUT', body: JSON.stringify({ name }) }),
  deleteDesignation: (name: string) => fetcher(`/designations/${name}`, { method: 'DELETE' }),

  getBatches: () => fetcher('/batches') as Promise<string[]>,
  createBatch: (name: string) => fetcher('/batches', { method: 'POST', body: JSON.stringify({ name }) }),
  updateBatch: (oldName: string, name: string) => fetcher(`/batches/${oldName}`, { method: 'PUT', body: JSON.stringify({ name }) }),
  deleteBatch: (name: string) => fetcher(`/batches/${name}`, { method: 'DELETE' }),

  getEvents: () => fetcher('/events') as Promise<ServiceEvent[]>,
  createEvent: (data: ServiceEvent) => fetcher('/events', { method: 'POST', body: JSON.stringify(data) }),

  getDar: () => fetcher('/dar') as Promise<DarRecord[]>,
  createDar: (data: DarRecord) => fetcher('/dar', { method: 'POST', body: JSON.stringify(data) }),

  getRewards: () => fetcher('/rewards') as Promise<RewardRecord[]>,
  createReward: (data: RewardRecord) => fetcher('/rewards', { method: 'POST', body: JSON.stringify(data) }),



  getSession: async (): Promise<Session | null> => {
    const res = await fetcher('/session');
    if (res.authenticated && res.user) {
      const reverseRoleMap: Record<string, "HR Manager" | "Roster Manager"> = {
        "hr_manager": "HR Manager",
        "roster_manager": "Roster Manager"
      };
      return { ...res.user, role: reverseRoleMap[res.user.role] } as Session;
    }
    return null;
  },
  
  login: async (data: Partial<Credential>): Promise<Session> => {
    const roleMap: Record<string, string> = {
      "HR Manager": "hr_manager",
      "Roster Manager": "roster_manager"
    };
    const mappedData = { ...data, role: roleMap[data.role as string] };
    const res = await fetcher('/login', { method: 'POST', body: JSON.stringify(mappedData) });
    if (res.authenticated && res.user) {
      const reverseRoleMap: Record<string, "HR Manager" | "Roster Manager"> = {
        "hr_manager": "HR Manager",
        "roster_manager": "Roster Manager"
      };
      return { ...res.user, role: reverseRoleMap[res.user.role] } as Session;
    }
    throw new Error("Invalid credentials");
  },
  
  logout: () => fetcher('/logout', { method: 'POST' }),
};