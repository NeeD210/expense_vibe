import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { useState } from "react";
import { Home, PieChart, Settings, Plus } from "lucide-react";
import HomePage from "./pages/HomePage";
import AnalysisPage from "./pages/AnalysisPage";
import ConfigPage from "./pages/ConfigPage";
import AddExpensePage from "./pages/AddExpensePage";

export default function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'analysis' | 'config' | 'add'>('home');
  
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm p-4 flex justify-between items-center border-b">
        <h2 className="text-xl font-semibold accent-text">Expense Tracker</h2>
        <SignOutButton />
      </header>
      
      <main className="flex-1 flex flex-col p-4 pb-20">
        <Authenticated>
          {currentPage === 'home' && <HomePage />}
          {currentPage === 'analysis' && <AnalysisPage />}
          {currentPage === 'config' && <ConfigPage />}
          {currentPage === 'add' && <AddExpensePage />}
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
      
      <Authenticated>
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t">
          <div className="flex justify-around p-4">
            <button
              onClick={() => setCurrentPage('home')}
              className={`p-2 ${currentPage === 'home' ? 'text-blue-500' : 'text-gray-500'}`}
            >
              <Home size={24} />
            </button>
            <button
              onClick={() => setCurrentPage('analysis')}
              className={`p-2 ${currentPage === 'analysis' ? 'text-blue-500' : 'text-gray-500'}`}
            >
              <PieChart size={24} />
            </button>
            <button
              onClick={() => setCurrentPage('config')}
              className={`p-2 ${currentPage === 'config' ? 'text-blue-500' : 'text-gray-500'}`}
            >
              <Settings size={24} />
            </button>
            <button
              onClick={() => setCurrentPage('add')}
              className={`p-2 ${currentPage === 'add' ? 'text-blue-500' : 'text-gray-500'}`}
            >
              <Plus size={24} />
            </button>
          </div>
        </nav>
      </Authenticated>
      
      <Toaster />
    </div>
  );
}
