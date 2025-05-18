import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useRef } from "react";
import { Home, PieChart, Settings, Plus, List, TrendingDown, TrendingUp } from "lucide-react";
import HomePage from "./pages/HomePage";
import AnalysisPage from "./pages/AnalysisPage";
import ConfigPage from "./pages/ConfigPage";
import AddExpensePage from "./pages/AddExpensePage";
import AddIncomePage from "./pages/AddIncomePage";
import ManageTransactionsPage from "./pages/ManageTransactionsPage";
import PerFiLogo from "./img/PerFi_logo.png";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useAuth0 } from "@auth0/auth0-react";
import { useMutation } from "convex/react";

export default function App() {
  const [currentPage, setCurrentPage] = useState<keyof typeof pageComponents>('home');
  const [showAddMenu, setShowAddMenu] = useState(false);
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const addMenuRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const initializeDefaultsDone = useRef(false);
  const [configKey, setConfigKey] = useState(0);
  const [manageKey, setManageKey] = useState(0);

  const { isLoading: auth0Loading, isAuthenticated, user } = useAuth0();
  const createUser = useMutation(api.auth.createUser);

  const pageComponents = {
    home: HomePage,
    analysis: AnalysisPage,
    config: () => <ConfigPage key={configKey} />,
    add: AddExpensePage,
    income: AddIncomePage,
    manage: () => <ManageTransactionsPage key={manageKey} />,
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

  useEffect(() => {
    const createUserIfNeeded = async () => {
      console.log("App.tsx Auth state check:", { auth0Loading, isAuthenticated, email: user?.email, sub: user?.sub });

      if (auth0Loading) {
        console.log("App.tsx: Auth0 is loading, waiting...");
        return;
      }

      if (isAuthenticated && user?.email && user?.sub) {
        try {
          console.log("App.tsx: Attempting to create user:", { email: user.email, auth0Id: user.sub });
          await createUser({
            email: user.email,
            auth0Id: user.sub
          });
          console.log("App.tsx: User creation/check successful for:", user.email);
        } catch (error: any) {
          console.warn("App.tsx: Error during createUser mutation (might be expected if user already exists):", error.message);
        }
      } else if (!auth0Loading) {
        console.log("App.tsx: Skipping user creation: conditions not met or Auth0 finished loading without user.");
      }
    };

    createUserIfNeeded();
  }, [auth0Loading, isAuthenticated, user, createUser]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Authenticated>
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm p-4 flex justify-between items-center border-b">
          <img src={PerFiLogo} alt="PerFi App Logo" className="h-10" />
          <div className="absolute left-1/2 transform -translate-x-1/2 text-2xl font-bold text-foreground">
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
            <Card className="w-full max-w-md">
              <CardHeader className="text-center">
                <img src={PerFiLogo} alt="PerFi App Logo" className="h-16 mx-auto mb-4" />
                <CardTitle className="text-xl text-muted-foreground">Sign in to get started</CardTitle>
              </CardHeader>
              <CardContent>
                <SignInForm setCurrentPage={setCurrentPage} />
              </CardContent>
            </Card>
          </div>
        </Unauthenticated>
      </main>
      
      <Authenticated>      
        <nav className="fixed bottom-0 left-0 right-0 bg-background border-t p-4">
          <div className="max-w-md mx-auto flex justify-around">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentPage('home')}
              className={cn(
                "rounded-full transition-colors",
                currentPage === 'home' ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Home size={24} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentPage('analysis')}
              className={cn(
                "rounded-full transition-colors",
                currentPage === 'analysis' ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <PieChart size={24} />
            </Button>
            <div className="relative">
              <Button
                ref={addButtonRef}
                onClick={() => setShowAddMenu(!showAddMenu)}
                size="icon"
                className="rounded-full bg-primary hover:bg-primary/90"
              >
                <Plus size={24} />
              </Button>
              {showAddMenu && (
                <div 
                  ref={addMenuRef} 
                  className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-popover rounded-lg shadow-lg border p-2 w-40"
                >
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setCurrentPage('add');
                      setShowAddMenu(false);
                    }}
                    className="flex items-center w-full justify-start gap-2"
                  >
                    <TrendingDown size={18} />
                    Expense
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setCurrentPage('income');
                      setShowAddMenu(false);
                    }}
                    className="flex items-center w-full justify-start gap-2"
                  >
                    <TrendingUp size={18} />
                    Income
                  </Button>
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setCurrentPage('manage');
                setManageKey(prev => prev + 1);
              }}
              className={cn(
                "rounded-full transition-colors",
                currentPage === 'manage' ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <List size={24} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setCurrentPage('config');
                setConfigKey(prev => prev + 1);
              }}
              className={cn(
                "rounded-full transition-colors",
                currentPage === 'config' ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Settings size={24} />
            </Button>
          </div>
        </nav>
      </Authenticated>
      <Toaster />
    </div>
  );
}
