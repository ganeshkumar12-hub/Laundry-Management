import { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Save, 
  User, 
  Phone, 
  Shirt, 
  DollarSign, 
  Hash,
  ArrowLeft,
  X
} from 'lucide-react';
import { 
  collection, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Garment, OrderStatus } from '../types';
import { cn } from '../lib/utils';
import { handleFirestoreError, OperationType } from '../lib/error-handler'; // I'll create this helper next

interface Props {
  onSuccess: () => void;
}

const COMMON_GARMENTS = [
  { type: 'Shirt', price: 5 },
  { type: 'Pants', price: 7 },
  { type: 'Saree', price: 15 },
  { type: 'Suit', price: 20 },
  { type: 'Bedding', price: 12 },
  { type: 'Other', price: 10 }
];

export default function CreateOrder({ onSuccess }: Props) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [garments, setGarments] = useState<Garment[]>([{ type: 'Shirt', quantity: 1, pricePerItem: 5 }]);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);

  const totalAmount = garments.reduce((sum, g) => sum + (g.quantity * g.pricePerItem), 0);

  const addGarment = () => {
    setGarments([...garments, { type: 'Shirt', quantity: 1, pricePerItem: 5 }]);
  };

  const updateGarment = (index: number, updates: Partial<Garment>) => {
    const newGarments = [...garments];
    newGarments[index] = { ...newGarments[index], ...updates };
    setGarments(newGarments);
  };

  const removeGarment = (index: number) => {
    if (garments.length === 1) return;
    setGarments(garments.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    
    setSubmitting(true);
    const path = 'orders';
    try {
      const docRef = await addDoc(collection(db, path), {
        customerName,
        customerPhone,
        garments,
        totalAmount,
        status: 'RECEIVED' as OrderStatus,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: auth.currentUser.uid
      });
      setCreatedOrderId(docRef.id);
      setShowConfirm(true);
    } catch (e: any) {
      console.error(e);
      // We'll implement handleFirestoreError in separate file
      try {
        const { handleFirestoreError, OperationType } = await import('../lib/error-handler');
        handleFirestoreError(e, OperationType.CREATE, path);
      } catch (err) {
        alert("Error creating order: " + e.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (showConfirm && createdOrderId) {
    return (
      <div className="max-w-md mx-auto text-center py-12 animate-in zoom-in-95 duration-300">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <Save className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-bold mb-2">Order Created!</h2>
        <p className="text-slate-500 mb-8 font-mono text-sm uppercase tracking-widest">Order ID: {createdOrderId}</p>
        
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm mb-8 text-left">
          <div className="flex justify-between mb-4 pb-4 border-b border-slate-50">
            <span className="text-slate-500">Customer</span>
            <span className="font-bold">{customerName}</span>
          </div>
          <div className="flex justify-between mb-4">
            <span className="text-slate-500">Total Items</span>
            <span className="font-bold">{garments.reduce((s, g) => s + g.quantity, 0)}</span>
          </div>
          <div className="flex justify-between text-lg font-black text-blue-600">
            <span>Bill Amount</span>
            <span>${totalAmount.toFixed(2)}</span>
          </div>
        </div>

        <button 
          onClick={onSuccess}
          className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all"
        >
          Check Order List
        </button>
      </div>
    );
  }

  return (
    <div className="animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onSuccess} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-3xl font-bold tracking-tight">New Order</h1>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Info */}
          <section className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              Customer Details
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    required
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    required
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    placeholder="+1 234 567 890"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Garments Info */}
          <section className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Shirt className="w-5 h-5 text-blue-600" />
                Garments
              </h3>
              <button 
                type="button"
                onClick={addGarment}
                className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Item
              </button>
            </div>

            <div className="space-y-4">
              {garments.map((garment, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row gap-4 p-4 bg-slate-50 rounded-2xl relative group">
                  <div className="flex-1 space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Garment Type</label>
                    <select
                      value={garment.type}
                      onChange={e => updateGarment(idx, { type: e.target.value, pricePerItem: COMMON_GARMENTS.find(cg => cg.type === e.target.value)?.price || garment.pricePerItem })}
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm"
                    >
                      {COMMON_GARMENTS.map(cg => <option key={cg.type} value={cg.type}>{cg.type}</option>)}
                    </select>
                  </div>
                  
                  <div className="w-full sm:w-24 space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Qty</label>
                    <div className="relative">
                      <Hash className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                      <input 
                        type="number"
                        min="1"
                        value={garment.quantity}
                        onChange={e => updateGarment(idx, { quantity: parseInt(e.target.value) || 1 })}
                        className="w-full pl-7 pr-2 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                      />
                    </div>
                  </div>

                  <div className="w-full sm:w-32 space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Price/pc</label>
                    <div className="relative">
                      <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                      <input 
                        type="number"
                        step="0.01"
                        value={garment.pricePerItem}
                        onChange={e => updateGarment(idx, { pricePerItem: parseFloat(e.target.value) || 0 })}
                        className="w-full pl-7 pr-2 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium"
                      />
                    </div>
                  </div>

                  <button 
                    type="button"
                    onClick={() => removeGarment(idx)}
                    className="absolute -right-2 -top-2 sm:static sm:mt-8 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar Summary */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 sticky top-8">
            <h3 className="text-lg font-bold mb-6">Order Summary</h3>
            
            <div className="space-y-4 mb-8">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Subtotal</span>
                <span className="font-semibold text-slate-900">${totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Service Fee</span>
                <span className="font-semibold text-slate-900">$0.00</span>
              </div>
              <div className="pt-4 border-t border-slate-100 flex justify-between items-end">
                <span className="text-slate-500 font-medium">Total Bill</span>
                <span className="text-3xl font-black text-blue-600">${totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <button
              disabled={submitting || !customerName}
              className={cn(
                "w-full py-4 rounded-2xl font-bold shadow-lg transition-all flex items-center justify-center gap-2",
                submitting || !customerName
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                  : "bg-blue-600 text-white shadow-blue-100 hover:bg-blue-700 active:scale-95"
              )}
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              {submitting ? 'Creating...' : 'Finalize Order'}
            </button>
            <p className="text-xs text-center text-slate-400 mt-4 leading-relaxed">
              By finalizing, the order will be assigned a unique ID and recorded in the database.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}
