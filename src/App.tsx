import { useState, useEffect } from 'react';
import { 
  Plus, 
  LayoutDashboard, 
  ListOrdered, 
  LogOut, 
  Waves,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  User
} from 'firebase/auth';
import { auth, db } from './lib/firebase';
import { doc, getDocFromServer } from 'firebase/firestore';
import { cn } from './lib/utils';

// Components
import Dashboard from './components/Dashboard';
import OrderList from './components/OrderList';
import CreateOrder from './components/CreateOrder';

type View = 'dashboard' | 'orders' | 'create';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
      
      if (u) {
        // Critical: Test connection as per Firebase instructions
        const testConn = async () => {
          try {
            await getDocFromServer(doc(db, 'test', 'connection'));
          } catch (e: any) {
            if (e.message?.includes('offline')) {
              setError("Please check your Firebase configuration or internet connection.");
            }
          }
        };
        testConn();
      }
    });
    return unsubscribe;
  }, []);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (e: any) {
      setError("Failed to sign in with Google.");
    }
  };

  const handleLogout = () => signOut(auth);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-200">
            <Waves className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-sans">BubbleFlow</h1>
        </div>
        
        <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200 border border-slate-100 max-w-md w-full text-center">
          <h2 className="text-xl font-semibold mb-2">Welcome Back</h2>
          <p className="text-slate-500 mb-8">Sign in to manage your laundry orders and track shop performance.</p>
          
          <button
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-all duration-200"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
            Continue with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-slate-200 flex flex-col">
        <div className="p-6 flex items-center gap-3">
          <Waves className="w-6 h-6 text-blue-600" />
          <span className="font-bold text-xl tracking-tight">BubbleFlow</span>
        </div>
        
        <nav className="flex-1 px-4 space-y-1">
          <SidebarLink 
            active={activeView === 'dashboard'} 
            onClick={() => setActiveView('dashboard')}
            icon={<LayoutDashboard className="w-5 h-5" />}
            label="Dashboard"
          />
          <SidebarLink 
            active={activeView === 'orders'} 
            onClick={() => setActiveView('orders')}
            icon={<ListOrdered className="w-5 h-5" />}
            label="All Orders"
          />
          <SidebarLink 
            active={activeView === 'create'} 
            onClick={() => setActiveView('create')}
            icon={<Plus className="w-5 h-5" />}
            label="New Order"
          />
        </nav>
        
        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 px-2 py-3 mb-2">
            <img 
              src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
              className="w-8 h-8 rounded-full border border-slate-200" 
              alt="Avatar"
              referrerPolicy="no-referrer"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">{user.displayName}</p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <div className="max-w-6xl mx-auto">
          {activeView === 'dashboard' && <Dashboard onNewOrder={() => setActiveView('create')} />}
          {activeView === 'orders' && <OrderList />}
          {activeView === 'create' && <CreateOrder onSuccess={() => setActiveView('orders')} />}
        </div>
      </main>
    </div>
  );
}

function SidebarLink({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
        active 
          ? "bg-blue-50 text-blue-600 shadow-sm shadow-blue-100" 
          : "text-slate-600 hover:bg-slate-100"
      )}
    >
      {icon}
      {label}
    </button>
  );
}
