export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  national_id: string;
  address?: string;
  role: 'customer' | 'staff' | 'admin';
  is_verified: boolean;
  created_at: string;
  extinguisher_count?: number;
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
  created_at: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  national_id?: string;
  days_until_expiry?: number;
}

export interface Notification {
  id: string;
  extinguisher_id: string;
  customer_id: string;
  type: 'expiry_30days' | 'expiry_14days' | 'expiry_7days' | 'expiry_1day' | 'expired';
  status: 'sent' | 'delivered' | 'acknowledged' | 'failed';
  sent_at: string;
  acknowledged_at?: string;
  customer_name?: string;
  customer_email?: string;
  expiry_date?: string;
  quantity?: number;
}

export interface Escalation {
  id: string;
  customer_id: string;
  extinguisher_id: string;
  reason: string;
  status: 'open' | 'in_review' | 'notified_authority' | 'resolved' | 'closed';
  authority_ref?: string;
  notes?: string;
  escalated_at: string;
  resolved_at?: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  national_id?: string;
  expiry_date?: string;
  quantity?: number;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}
