export type Role = 'admin' | 'manager' | 'technician' | 'customer';

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: Role;
  is_active: boolean;
  is_staff: boolean;
}

export interface TokenPair {
  access: string;
  refresh: string;
}

export interface Company {
  id: number;
  name: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  address: string;
}

export interface Customer {
  id: number;
  company: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  user: number | null;
  site_count: number;
  created_at: string;
}

export interface Site {
  id: number;
  customer: number;
  customer_name: string;
  name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  contact_name: string;
  contact_phone: string;
  asset_count: number;
}

export type AssetStatus = 'operational' | 'under_maintenance' | 'out_of_service';

export interface Asset {
  id: number;
  site: number;
  site_name: string;
  name: string;
  asset_type: string;
  serial_number: string;
  status: AssetStatus;
}

export interface Technician {
  id: number;
  user: number;
  username: string;
  full_name: string;
  specialty: string;
  hourly_rate: string;
  is_active: boolean;
  latitude: number | null;
  longitude: number | null;
  open_work_orders: number;
}

export interface Part {
  id: number;
  sku: string;
  name: string;
  description: string;
  stock_qty: number;
  unit_price: string;
  created_at: string;
}

export type WorkOrderPriority = 'low' | 'medium' | 'high' | 'urgent';

export type WorkOrderStatus =
  | 'new'
  | 'assigned'
  | 'accepted'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface WorkOrder {
  id: number;
  number: string;
  customer: number;
  customer_name: string;
  site: number;
  site_name: string;
  asset: number | null;
  asset_name: string;
  assigned_technician: number | null;
  assigned_technician_name: string;
  title: string;
  description: string;
  priority: WorkOrderPriority;
  status: WorkOrderStatus;
  open_date: string;
  due_at: string | null;
  completed_at: string | null;
  resolution_minutes: number | null;
  is_overdue: boolean;
  available_transitions: WorkOrderStatus[];
}

export interface WorkOrderPart {
  id: number;
  part: number;
  part_name: string;
  part_sku: string;
  quantity: number;
  unit_price: string;
  line_total: number;
}

export interface TimeEntry {
  id: number;
  work_order: number;
  technician: number;
  technician_name: string;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number;
}

export interface ServiceReport {
  id: number;
  work_order: number;
  work_order_number: string;
  diagnosis: string;
  resolution: string;
  labor_hours: string;
  customer_confirmation: boolean;
  signature: string;
}

export interface AuditLog {
  id: number;
  from_status: string;
  to_status: string;
  user_name: string;
  note: string;
  created_at: string;
}

export interface WorkOrderFile {
  id: number;
  work_order: number;
  file: string;
  name: string;
  uploaded_by: number | null;
  uploaded_by_name: string;
  created_at: string;
}

export interface WorkOrderDetail extends WorkOrder {
  parts: WorkOrderPart[];
  time_entries: TimeEntry[];
  files: WorkOrderFile[];
  service_report: ServiceReport | null;
  audit_logs: AuditLog[];
}

export interface DashboardStats {
  open_tickets: number;
  in_progress: number;
  completed: number;
  technicians: number;
  overdue: number;
}

export interface WorkloadRow {
  technician: string;
  count: number;
}

export interface Sla {
  breaches: number;
  open_orders: number;
  on_time: number;
}

export interface AvgResolution {
  avg_resolution_minutes: number | null;
}

export interface PartsConsumption {
  part: string;
  sku: string;
  quantity: number;
}

export interface OverTimeRow {
  status: WorkOrderStatus;
  count: number;
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
