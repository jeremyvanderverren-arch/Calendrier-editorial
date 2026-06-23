export type ChannelType = string;
export type StatusType = string;
export type KpiType = string;

export interface Publication {
  id: string;
  date: string; // format YYYY-MM-DD
  endDate?: string; // (optional) format YYYY-MM-DD
  title: string;
  channel: ChannelType;
  persona: string;
  status: StatusType;
  copywriting: string;
  kpi: KpiType;
  createdBy?: string; // User ID or name of the creator
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: "editor" | "viewer"; // "editor" allows modifications/additions, "viewer" is read-only
  avatar?: string;
}

export interface ValidationAlert {
  type: "warning" | "info";
  message: string;
  suggestion: string;
  publicationId?: string;
}
