import { Card, CardContent } from "@/components/ui/card";
import { List, Repeat } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function TransactionsNavigationPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-[calc(100vh-11rem)]">
      <div className="flex-1">
        <h1 className="text-2xl font-bold mb-4">Transactions</h1>
        
        <div className="grid gap-4">
          <Card
            onClick={() => navigate("/transactions/manage")}
            className="cursor-pointer transition-shadow hover:shadow-lg"
          >
            <CardContent className="p-4">
              <div className="w-full flex items-center gap-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <List className="h-6 w-6 text-primary" />
                </div>
                <div className="flex flex-col items-start text-left gap-1">
                  <span className="font-medium">Manage Transactions</span>
                  <span className="text-sm text-muted-foreground">View, edit, and delete your transactions</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            onClick={() => navigate("/transactions/recurring")}
            className="cursor-pointer transition-shadow hover:shadow-lg"
          >
            <CardContent className="p-4">
              <div className="w-full flex items-center gap-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Repeat className="h-6 w-6 text-primary" />
                </div>
                <div className="flex flex-col items-start text-left gap-1">
                  <span className="font-medium">Manage Recurring</span>
                  <span className="text-sm text-muted-foreground">Set up and manage recurring transactions</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 