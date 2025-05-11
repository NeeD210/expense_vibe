import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { useState } from "react";
import { Home, PieChart, Settings, Plus, List } from "lucide-react";
import HomePage from "./pages/HomePage";
import AnalysisPage from "./pages/AnalysisPage";
import ConfigPage from "./pages/ConfigPage";
import AddExpensePage from "./pages/AddExpensePage";
import AddIncomePage from "./pages/AddIncomePage";
import ManageExpensesPage from "./pages/ManageExpensesPage";
import PerFiLogo from "./img/PerFi_logo.png";

export default function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'analysis' | 'config' | 'add' | 'manage' | 'income'>('home');
  const [showAddMenu, setShowAddMenu] = useState(false);
  
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm p-4 flex justify-between items-center border-b">
        <img src={PerFiLogo} alt="PerFi App Logo" className="h-10" />
        <SignOutButton />
      </header>
      
      <main className="flex-1 flex flex-col p-4 pb-20">
        <Authenticated>
          {currentPage === 'home' && <HomePage />}
          {currentPage === 'analysis' && <AnalysisPage />}
          {currentPage === 'config' && <ConfigPage />}
          {currentPage === 'add' && <AddExpensePage />}
          {currentPage === 'income' && <AddIncomePage />}
          {currentPage === 'manage' && <ManageExpensesPage />}
        </Authenticated>
        
        <Unauthenticated>
          <div className="flex-1 flex items-center justify-center">
            <div className="w-full max-w-md">
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold accent-text mb-4">Expense Tracker</h1>
                <p className="text-xl text-slate-600">Sign in to get started</p>
              </div>
              <SignInForm />
            </div>
          </div>
        </Unauthenticated>
      </main>
      
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
              onClick={() => setShowAddMenu(!showAddMenu)}
              className={`p-2 rounded-full transition-colors ${
                (currentPage === 'add' || currentPage === 'income') ? 'text-blue-500' : 'text-gray-500'
              }`}
            >
              <Plus size={24} />
            </button>
            {showAddMenu && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-white rounded-lg shadow-lg border p-2">
                <button
                  onClick={() => {
                    setCurrentPage('add');
                    setShowAddMenu(false);
                  }}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100 rounded"
                >
                  Expense
                </button>
                <button
                  onClick={() => {
                    setCurrentPage('income');
                    setShowAddMenu(false);
                  }}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100 rounded"
                >
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
      
      <Toaster />
    </div>
  );
}
