import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy,
  updateDoc,
  doc,
  serverTimestamp
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Order, OrderStatus } from '../types';
import { 
  Search, 
  Filter, 
  MoreVertical, 
  CheckCircle2, 
  Clock, 
  Truck, 
  Package,
  Calendar,
  Phone,
  User,
  ExternalLink,
  ChevronDown,
  Waves
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import { handleFirestoreError, OperationType } from '../lib/error-handler';
import { getWashCareAdvice } from '../services/geminiService';
import Markdown from 'react-markdown';

const STATUS_CONFIG: Record<OrderStatus, { label: string, color: string, icon: any }> = {
  'RECEIVED': { label: 'Received', color: 'bg-blue-100 text-blue-700', icon: Package },
  'PROCESSING': { label: 'Processing', color: 'bg-amber-100 text-amber-700', icon: Clock },
  'READY': { label: 'Ready', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  'DELIVERED': { label: 'Delivered', color: 'bg-slate-100 text-slate-700', icon: Truck }
};

function WashAdvice({ garments }: { garments: any[] }) {
  const [advice, setAdvice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchAdvice = async () => {
    setLoading(true);
    const res = await getWashCareAdvice(garments);
    setAdvice(res);
    setLoading(false);
  };

  return (
    <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100">
      {!advice && !loading && (
        <button 
          onClick={fetchAdvice}
          className="w-full py-2 text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center justify-center gap-2"
        >
          <Waves className="w-4 h-4" /> Get AI Wash Advice
        </button>
      )}
      {loading && <div className="text-[10px] text-blue-400 font-bold animate-pulse text-center">Consulting AI Expert...</div>}
      {advice && (
        <div className="prose prose-sm text-[11px] text-slate-600 leading-relaxed">
          <Markdown>{advice}</Markdown>
        </div>
      )}
    </div>
  );
}

export default function OrderList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL'>('ALL');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'orders'),
      where('createdBy', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      setOrders(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'orders');
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.customerName.toLowerCase().includes(search.toLowerCase()) || 
      order.customerPhone.includes(search);
    const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const updateStatus = async (orderId: string, newStatus: OrderStatus) => {
    const path = `orders/${orderId}`;
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
    } catch (e: any) {
      handleFirestoreError(e, OperationType.UPDATE, path);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1,2,3].map(i => <div key={i} className="h-24 bg-slate-100 animate-pulse rounded-2xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <header>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Orders Management</h1>
        <p className="text-slate-500">Search and update status for all laundry orders.</p>
      </header>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or phone..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all outline-none text-sm"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          {(['ALL', 'RECEIVED', 'PROCESSING', 'READY', 'DELIVERED'] as const).map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all",
                statusFilter === status 
                  ? "bg-slate-900 text-white shadow-sm" 
                  : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300"
              )}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.map(order => {
          const StatusIcon = STATUS_CONFIG[order.status].icon;
          const isExpanded = expandedOrder === order.id;

          return (
            <div key={order.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
              <div 
                className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
                onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2 py-0.5 bg-slate-50 rounded-md border border-slate-100">
                      ID: {order.id.slice(0, 8)}
                    </span>
                    <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1.5", STATUS_CONFIG[order.status].color)}>
                      <StatusIcon className="w-3 h-3" />
                      {STATUS_CONFIG[order.status].label}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{order.customerName}</h3>
                  <div className="flex items-center gap-4 mt-1">
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <Phone className="w-3 h-3" />
                      {order.customerPhone}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <Calendar className="w-3 h-3" />
                      {format(order.createdAt.toDate(), 'MMM d, h:mm a')}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6 sm:text-right border-t sm:border-t-0 pt-4 sm:pt-0 border-slate-50">
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Order Total</p>
                    <p className="text-xl font-black text-slate-900">${order.totalAmount.toFixed(2)}</p>
                  </div>
                  <ChevronDown className={cn("w-5 h-5 text-slate-400 transition-transform duration-300", isExpanded && "rotate-180")} />
                </div>
              </div>

              {isExpanded && (
                <div className="bg-slate-50/50 p-6 sm:p-8 border-t border-slate-100 animate-in slide-in-from-top-4 duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 pb-2 border-b border-slate-200">Garment Breakdown</h4>
                      <div className="space-y-3">
                        {order.garments.map((g, idx) => (
                          <div key={idx} className="flex justify-between items-center text-sm">
                            <div className="flex items-center gap-3">
                              <span className="w-6 h-6 flex items-center justify-center bg-white rounded-md text-[10px] font-bold border border-slate-200">{g.quantity}x</span>
                              <span className="font-semibold text-slate-700">{g.type}</span>
                            </div>
                            <span className="font-mono text-slate-500">${(g.quantity * g.pricePerItem).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 pb-2 border-b border-slate-200 uppercase">AI Care Expert</h4>
                        <WashAdvice garments={order.garments} />
                      </div>

                      <div>
                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 pb-2 border-b border-slate-200">Update Phase</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {(['RECEIVED', 'PROCESSING', 'READY', 'DELIVERED'] as OrderStatus[]).map(s => (
                            <button
                              key={s}
                              disabled={order.status === s}
                              onClick={() => updateStatus(order.id, s)}
                              className={cn(
                                "flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all border",
                                order.status === s 
                                  ? "bg-slate-100 text-slate-400 border-transparent cursor-not-allowed" 
                                  : "bg-white text-slate-700 border-slate-200 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50"
                              )}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="p-4 bg-white rounded-2xl border border-slate-200">
                        <p className="text-xs font-bold text-slate-500 mb-1">Last Update</p>
                        <p className="text-sm text-slate-700">{format(order.updatedAt.toDate(), 'eeee, MMMM do · h:mm a')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filteredOrders.length === 0 && (
          <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-slate-200">
            <Package className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-400">No orders found</h3>
            <p className="text-slate-400 text-sm">Try adjusting your filters or search terms.</p>
          </div>
        )}
      </div>
    </div>
  );
}
