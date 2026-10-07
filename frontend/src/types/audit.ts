export interface AuditLog {
  id: number;
  userId?: number;
  username: string;
  userFullName: string;
  action: string;
  entityType?: string;
  entityId?: string;
  details?: string;
  ipAddress?: string;
  createdAt: string;
}

export interface AuditLogResponse {
  content: AuditLog[];
  totalElements: number;
  totalPages: number;
  number: number;
}
