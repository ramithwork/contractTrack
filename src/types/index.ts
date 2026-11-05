export type UserRole = 'admin' | 'manager' | 'staff';

export interface User {
  id: string;
  username: string;
  email?: string;
  displayName: string;
  role: UserRole;
  departmentId: string;
  departmentName: string;
  phoneNumber?: string;
  status: 'active' | 'inactive';
  passwordHash?: string; // Stored securely for username-based authentication
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description: string;
  headOfDepartment: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export type ContractStatus =
  | 'active'
  | 'pending_renewal'
  | 'under_review'
  | 'renewed'
  | 'terminated'
  | 'expired';

export type ContractType =
  | 'Maintenance & SLA'
  | 'Food & Beverage Supply'
  | 'Software & IT Systems'
  | 'Housekeeping & Linen'
  | 'Facilities & Engineering'
  | 'Security & Safety'
  | 'Event & Banqueting'
  | 'Consultancy & Legal'
  | 'Lease & Property'
  | 'Other';

export interface Contract {
  id: string;
  title: string;
  contractNumber: string;
  vendorName: string;
  vendorContact: string;
  departmentId: string;
  departmentName: string;
  tags: string[]; // Contract Tags (e.g. SLA, IT, Food, Housekeeping, Elevators)
  contractType?: string; // Legacy fallback
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  renewalDate: string; // YYYY-MM-DD
  noticePeriodDays: number; // e.g. 30, 60, 90
  value?: number;
  currency?: string; // LKR, USD, etc.
  status: ContractStatus;
  autoRenewal: boolean;
  reminderDays: number[]; // e.g. [90, 60, 30, 14, 7, 1]
  assignedUserIds: string[]; // Assigned users who can view and receive reminders
  assignedUserNames: string[];
  creatorId: string; // User who added contract
  creatorName: string;
  keyTerms: string;
  notes: string;
  attachmentName?: string;
  lastRenewalDate?: string;
  createdAt: string;
  updatedAt: string;
}

export type UrgencyLevel = 'overdue' | 'urgent' | 'upcoming' | 'good_standing';

export interface ContractUrgency {
  daysRemaining: number;
  level: UrgencyLevel;
  badgeLabel: string;
  colorClass: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  departmentId: string;
  departmentName: string;
  action:
    | 'CONTRACT_CREATED'
    | 'CONTRACT_UPDATED'
    | 'CONTRACT_RENEWED'
    | 'CONTRACT_TERMINATED'
    | 'CONTRACT_DELETED'
    | 'USER_CREATED'
    | 'USER_UPDATED'
    | 'USER_DELETED'
    | 'DEPT_CREATED'
    | 'DEPT_UPDATED'
    | 'DEPT_DELETED'
    | 'LOGIN'
    | 'NOTIFICATION_SENT';
  details: string;
  targetId: string;
  timestamp: string;
}

export interface ContractNotification {
  id: string;
  userId: string; // recipient
  contractId: string;
  contractTitle: string;
  contractNumber: string;
  departmentName: string;
  renewalDate: string;
  daysRemaining: number;
  type: 'renewal_urgent' | 'renewal_upcoming' | 'assigned' | 'status_change';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface DepartmentReport {
  department: Department;
  totalContracts: number;
  activeContracts: number;
  pendingRenewal: number;
  expiredContracts: number;
  upcomingRenewals30Days: number;
  upcomingRenewals90Days: number;
  assignedStaffCount: number;
}
