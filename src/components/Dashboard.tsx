import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot,
  orderBy
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Order, OrderStatus } from '../types';
import { 
  TrendingUp, 
  ShoppingBag, 
  CheckCircle2, 
  Clock,
  ArrowRight,
  Plus
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { cn } from '../lib/utils';

interface Props {
  onNewOrder: () => void;
}

export default function Dashboard({ onNewOrder }: Props) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

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
      console.error("Dashboard Snapshot Error:", error);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const stats = {
    totalOrders: orders.length,
    totalRevenue: orders.reduce((sum, order) => sum + order.totalAmount, 0),
    activeOrders: orders.filter(o => o.status !== 'DELIVERED').length,
    deliveredToday: orders.filter(o => {
      const today = new Date().toDateString();
      return o.status === 'DELIVERED' && o.updatedAt.toDate().toDateString() === today;
    }).length
  };

  const statusData = [
    { name: 'Received', value: orders.filter(o => o.status === 'RECEIVED').length, color: '#3b82f6' },
    { name: 'Processing', value: orders.filter(o => o.status === 'PROCESSING').length, color: '#f59e0b' },
    { name: 'Ready', value: orders.filter(o => o.status === 'READY').length, color: '#10b981' },
    { name: 'Delivered', value: orders.filter(o => o.status === 'DELIVERED').length, color: '#6366f1' },
  ];

  if (loading) {
    return <div className="animate-pulse space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[1,2,3,4].map(i => <div key={i} className="h-32 bg-slate-200 rounded-3xl" />)}
      </div>
      <div className="h-80 bg-slate-200 rounded-3xl" />
    </div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Overview</h1>
          <p className="text-slate-500">Welcome back to your shop control center.</p>
        </div>
        <button
          onClick={onNewOrder}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-semibold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Create Order
        </button>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Total Revenue" 
          value={`$${stats.totalRevenue.toFixed(2)}`} 
          icon={<TrendingUp className="w-6 h-6 text-emerald-600" />}
          trend="+12% from last week"
          color="bg-emerald-50"
        />
        <StatCard 
          label="All Orders" 
          value={stats.totalOrders.toString()} 
          icon={<ShoppingBag className="w-6 h-6 text-blue-600" />}
          trend="Lifetime orders"
          color="bg-blue-50"
        />
        <StatCard 
          label="In Progress" 
          value={stats.activeOrders.toString()} 
          icon={<Clock className="w-6 h-6 text-amber-600" />}
          trend="Waiting for action"
          color="bg-amber-50"
        />
        <StatCard 
          label="Delivered" 
          value={stats.deliveredToday.toString()} 
          icon={<CheckCircle2 className="w-6 h-6 text-indigo-600" />}
          trend="Last 24 hours"
          color="bg-indigo-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart Column */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold">Order Distribution</h3>
            <span className="text-sm font-medium text-slate-400">By current status</span>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' 
                  }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={50}>
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Orders Column */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold">Recent Orders</h3>
            <ArrowRight className="w-5 h-5 text-slate-400" />
          </div>
          
          <div className="space-y-4 flex-1">
            {orders.slice(0, 5).map(order => (
              <div key={order.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    order.status === 'RECEIVED' ? "bg-blue-50 text-blue-600" :
                    order.status === 'PROCESSING' ? "bg-amber-50 text-amber-600" :
                    order.status === 'READY' ? "bg-emerald-50 text-emerald-600" :
                    "bg-slate-50 text-slate-600"
                  )}>
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{order.customerName}</p>
                    <p className="text-xs text-slate-500">{order.status}</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-slate-900">${order.totalAmount.toFixed(2)}</span>
              </div>
            ))}
            {orders.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full py-12 text-slate-400">
                <ShoppingBag className="w-12 h-12 mb-3 opacity-20" />
                <p className="text-sm italic">No orders yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, trend, color }: { label: string, value: string, icon: React.ReactNode, trend: string, color: string }) {
  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className={cn("p-3 rounded-2xl", color)}>
          {icon}
        </div>
      </div>
      <div>
        <p className="text-slate-500 text-sm font-medium mb-1">{label}</p>
        <h3 className="text-2xl font-bold text-slate-900 mb-1">{value}</h3>
        <p className="text-xs text-slate-400 font-medium">{trend}</p>
      </div>
    </div>
  );
}
