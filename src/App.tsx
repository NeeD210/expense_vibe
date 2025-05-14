import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { Toaster } from "sonner";
import { useState, useEffect, useRef } from "react";
import { Home, PieChart, Settings, Plus, List, TrendingDown, TrendingUp } from "lucide-react";
import HomePage from "./pages/HomePage";
import AnalysisPage from "./pages/AnalysisPage";
import ConfigPage from "./pages/ConfigPage";
import AddExpensePage from "./pages/AddExpensePage";
import AddIncomePage from "./pages/AddIncomePage";
import ManageTransactionsPage from "./pages/ManageTransactionsPage";
import PerFiLogo from "./img/PerFi_logo.png";

export default function App() {
  const [currentPage, setCurrentPage] = useState<keyof typeof pageComponents>('home');
  const [showAddMenu, setShowAddMenu] = useState(false);
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const addMenuRef = useRef<HTMLDivElement>(null);
  
  const pageComponents = {
    home: HomePage,
    analysis: AnalysisPage,
    config: ConfigPage,
    add: AddExpensePage,
    income: AddIncomePage,
    manage: ManageTransactionsPage,
  };

  const CurrentPageComponent = pageComponents[currentPage];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        showAddMenu &&
        addButtonRef.current &&
        !addButtonRef.current.contains(event.target as Node) &&
        addMenuRef.current &&
        !addMenuRef.current.contains(event.target as Node)
      ) {
        setShowAddMenu(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showAddMenu]);

  return (
    <div className="min-h-screen flex flex-col">
      <Authenticated>
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm p-4 flex justify-between items-center border-b">
          <img src={PerFiLogo} alt="PerFi App Logo" className="h-10" />
          <div className="absolute left-1/2 transform -translate-x-1/2 text-2xl font-bold">
            {currentPage === 'home' && 'Home'}
            {currentPage === 'analysis' && 'Analysis'}
            {currentPage === 'add' && 'Expense'}
            {currentPage === 'income' && 'Income'}
            {currentPage === 'manage' && 'Manage Transactions'}
            {currentPage === 'config' && 'Settings'}
          </div>
        </header>
      </Authenticated>
      
      <main className="flex-1 flex flex-col p-4 pb-20">
        <Authenticated>
          <CurrentPageComponent />
        </Authenticated>
        
        <Unauthenticated>
          <div className="flex-1 flex items-center justify-center">
            <div className="w-full max-w-md">
              <div className="text-center mb-8">
                <img src={PerFiLogo} alt="PerFi App Logo" className="h-16 mx-auto mb-4" />
                <p className="text-xl text-slate-600">Sign in to get started</p>
              </div>
              <SignInForm setCurrentPage={setCurrentPage} />
            </div>
          </div>
        </Unauthenticated>
      </main>
      
      <Authenticated>      
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
          <div className="max-w-md mx-auto flex justify-around">
            <button
              onClick={() => setCurrentPage('home')}
              className={`p-2 rounded-full transition-colors ${
                currentPage === 'home' ? 'text-blue-500' : 'text-gray-500'
              }`}
            >
              <Home size={24} />
            </button>
            <button
              onClick={() => setCurrentPage('analysis')}
              className={`p-2 rounded-full transition-colors ${
                currentPage === 'analysis' ? 'text-blue-500' : 'text-gray-500'
              }`}
            >
              <PieChart size={24} />
            </button>
            <div className="relative">
              <button
                ref={addButtonRef}
                onClick={() => setShowAddMenu(!showAddMenu)}
                className={`p-2 rounded-md bg-[#C554C4] text-white transition-colors`}
              >
                <Plus size={24} />
              </button>
              {showAddMenu && (
                <div 
                  ref={addMenuRef} 
                  className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-white rounded-lg shadow-lg border p-2 w-40">
                  <button
                    onClick={() => {
                      setCurrentPage('add');
                      setShowAddMenu(false);
                    }}
                    className="flex items-center w-full text-left px-4 py-2 hover:bg-gray-100 rounded"
                  >
                    <TrendingDown size={18} className="mr-2" />
                    Expense
                  </button>
                  <button
                    onClick={() => {
                      setCurrentPage('income');
                      setShowAddMenu(false);
                    }}
                    className="flex items-center w-full text-left px-4 py-2 hover:bg-gray-100 rounded"
                  >
                    <TrendingUp size={18} className="mr-2" />
                    Income
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={() => setCurrentPage('manage')}
              className={`p-2 rounded-full transition-colors ${
                currentPage === 'manage' ? 'text-blue-500' : 'text-gray-500'
              }`}
            >
              <List size={24} />
            </button>
            <button
              onClick={() => setCurrentPage('config')}
              className={`p-2 rounded-full transition-colors ${
                currentPage === 'config' ? 'text-blue-500' : 'text-gray-500'
              }`}
            >
              <Settings size={24} />
            </button>
          </div>
        </nav>
      </Authenticated>
      <Toaster position="bottom-center" offset="80px" />
    </div>
  );
}
