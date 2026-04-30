import { Timestamp } from 'firebase/firestore';

export type OrderStatus = 'RECEIVED' | 'PROCESSING' | 'READY' | 'DELIVERED';

export interface Garment {
  type: string;
  quantity: number;
  pricePerItem: number;
}

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  garments: Garment[];
  totalAmount: number;
  status: OrderStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  estimatedDeliveryDate?: Timestamp;
  createdBy: string;
}

export interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  ordersPerStatus: Record<OrderStatus, number>;
}
