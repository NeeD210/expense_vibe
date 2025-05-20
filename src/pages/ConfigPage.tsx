import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Moon, Sun } from "lucide-react";
import { SignOutButton } from "../SignOutButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Id } from "../../convex/_generated/dataModel";
import { useTheme } from "../context/ThemeContext";
import { PaymentTypeList } from "../components/PaymentTypeList";

type ConfigView = "navigation" | "categories" | "incomeCategories" | "paymentTypes";

export default function ConfigPage() {
  const [currentView, setCurrentView] = useState<ConfigView>("navigation");
  const categories = useQuery(api.expenses.getCategoriesWithIds) ?? [];
  const updateCategories = useMutation(api.expenses.updateCategories);
  const [newExpenseCategory, setNewExpenseCategory] = useState("");
  const [newIncomeCategory, setNewIncomeCategory] = useState("");
  const { toast } = useToast();
  const { theme, toggleTheme } = useTheme();

  // Reset currentView to "navigation" when component mounts
  useEffect(() => {
    setCurrentView("navigation");
  }, []);

  const handleAddCategory = async (name: string, type: "income" | "expense") => {
    if (!name.trim()) return;
    try {
      const newCategory = { name: name.trim(), transactionType: type };
      const updatedCategories = [
        ...categories.map(c => ({ name: c.name, transactionType: c.transactionType ?? "expense" })),
        newCategory
      ];
      await updateCategories({ categories: updatedCategories });
      if (type === "income") {
        setNewIncomeCategory("");
      } else {
        setNewExpenseCategory("");
      }
      toast({ title: "Category added" });
    } catch (error) {
      console.error("Failed to add category:", error);
      toast({ 
        variant: "destructive",
        title: "Error",
        description: "Failed to add category"
      });
    }
  };
  
  const handleRemoveCategory = async (category: { _id: Id<"categories">, name: string, transactionType?: string }) => {
    try {
      const updatedCategories = categories
        .filter(c => c._id !== category._id)
        .map(c => ({ 
          name: c.name, 
          transactionType: c.transactionType ?? "expense" 
        }));
      await updateCategories({ categories: updatedCategories });
      toast({ title: "Category removed" });
    } catch (error) {
      console.error("Failed to remove category:", error);
      toast({ 
        variant: "destructive",
        title: "Error",
        description: "Failed to remove category"
      });
    }
  };

  if (currentView === "navigation") {
    return (
      <div className="flex flex-col h-[calc(100vh-11rem)]">
        <div className="flex-1">
          <div className="grid gap-4">
            <Card
              onClick={() => setCurrentView("categories")}
              className="cursor-pointer transition-shadow hover:shadow-lg"
            >
              <div className="p-4">
                <div className="w-full flex flex-col items-start text-left gap-1">
                  <span className="font-medium">Expense Categories</span>
                  <span className="text-sm text-muted-foreground">Add, remove, or edit expense categories</span>
                </div>
              </div>
            </Card>
            <Card
              onClick={() => setCurrentView("incomeCategories")}
              className="cursor-pointer transition-shadow hover:shadow-lg"
            >
              <div className="p-4">
                <div className="w-full flex flex-col items-start text-left gap-1">
                  <span className="font-medium">Income Categories</span>
                  <span className="text-sm text-muted-foreground">Add, remove, or edit income categories</span>
                </div>
              </div>
            </Card>
            <Card
              onClick={() => setCurrentView("paymentTypes")}
              className="cursor-pointer transition-shadow hover:shadow-lg"
            >
              <div className="p-4">
                <div className="w-full flex flex-col items-start text-left gap-1">
                  <span className="font-medium">Modify Payment Types</span>
                  <span className="text-sm text-muted-foreground">Add, remove, or edit payment methods</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
        <div className="mt-auto border-t pt-6 flex justify-between items-center">
          <SignOutButton />
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="rounded-full"
          >
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentView("navigation")}
          className="rounded-full"
        >
          <ArrowLeft size={20} />
        </Button>
        <h2 className="text-2xl font-semibold">
          {currentView === "categories" ? "Expense Categories" : 
           currentView === "incomeCategories" ? "Income Categories" : 
           "Payment Types"}
        </h2>
      </div>

      {currentView === "categories" ? (
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="text"
              value={newExpenseCategory}
              onChange={e => setNewExpenseCategory(e.target.value)}
              placeholder="New expense category"
              className="flex-1"
            />
            <Button onClick={() => handleAddCategory(newExpenseCategory, "expense")}>
              Add
            </Button>
          </div>
          <div className="flex flex-col gap-2">
            {categories
              .filter(c => c.transactionType === "expense")
              .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()))
              .map(category => (
                <Card key={category._id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <span>{category.name}</span>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveCategory(category)}
                    >
                      Remove
                    </Button>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      ) : currentView === "incomeCategories" ? (
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="text"
              value={newIncomeCategory}
              onChange={e => setNewIncomeCategory(e.target.value)}
              placeholder="New income category"
              className="flex-1"
            />
            <Button onClick={() => handleAddCategory(newIncomeCategory, "income")}>
              Add
            </Button>
          </div>
          <div className="flex flex-col gap-2">
            {categories
              .filter(c => c.transactionType === "income")
              .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()))
              .map(category => (
                <Card key={category._id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <span>{category.name}</span>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveCategory(category)}
                    >
                      Remove
                    </Button>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      ) : (
        <PaymentTypeList />
      )}
    </div>
  );
}
