export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  national_id: string;
  address?: string;
  role: 'customer' | 'staff' | 'admin';
  is_verified: boolean;
  created_at: Date;
}

export interface Extinguisher {
  id: string;
  customer_id: string;
  quantity: number;
  serial_numbers?: string[];
  purchase_date: string;
  expiry_date: string;
  status: 'active' | 'expiring_soon' | 'expired' | 'renewed' | 'escalated';
  notes?: string;
  created_by?: string;
  created_at: Date;
}

export interface Notification {
  id: string;
  extinguisher_id: string;
  customer_id: string;
  type: 'expiry_30days' | 'expiry_14days' | 'expiry_7days' | 'expiry_1day' | 'expired';
  status: 'sent' | 'delivered' | 'acknowledged' | 'failed';
  sent_at: Date;
  acknowledged_at?: Date;
}

export interface Escalation {
  id: string;
  customer_id: string;
  extinguisher_id: string;
  reason: string;
  status: 'open' | 'in_review' | 'notified_authority' | 'resolved' | 'closed';
  authority_ref?: string;
  notes?: string;
  escalated_at: Date;
  resolved_at?: Date;
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string>;
}
