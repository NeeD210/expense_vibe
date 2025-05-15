import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { SignOutButton } from "../SignOutButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Id } from "../../convex/_generated/dataModel";

type ConfigView = "navigation" | "categories" | "paymentTypes";

export default function ConfigPage() {
  const [currentView, setCurrentView] = useState<ConfigView>("navigation");
  const categories = useQuery(api.expenses.getCategories) ?? [];
  const paymentTypes = useQuery(api.expenses.getPaymentTypes) ?? [];
  const updateCategories = useMutation(api.expenses.updateCategories);
  const addPaymentType = useMutation(api.expenses.addPaymentType);
  const removePaymentType = useMutation(api.expenses.removePaymentType);
  const initializeDefaultPaymentTypes = useMutation(api.expenses.initializeDefaultPaymentTypes);
  const [newCategory, setNewCategory] = useState("");
  const [newPaymentType, setNewPaymentType] = useState("");
  const { toast } = useToast();

  // Initialize default payment types if none exist
  useEffect(() => {
    const initializePaymentTypes = async () => {
      if (paymentTypes.length === 0) {
        try {
          await initializeDefaultPaymentTypes();
          toast({ title: "Default payment types initialized" });
        } catch (error) {
          console.error("Failed to initialize default payment types:", error);
          toast({ 
            variant: "destructive",
            title: "Error",
            description: "Failed to initialize default payment types"
          });
        }
      }
    };
    initializePaymentTypes();
  }, [paymentTypes.length, initializeDefaultPaymentTypes, toast]);

  const handleAddCategory = () => {
    if (!newCategory.trim()) return;
    updateCategories({ categories: [...categories, newCategory.trim()] });
    setNewCategory("");
    toast({ title: "Category added" });
  };
  
  const handleRemoveCategory = (category: string) => {
    updateCategories({ categories: categories.filter(c => c !== category) });
    toast({ title: "Category removed" });
  };

  const handleAddPaymentType = async () => {
    if (!newPaymentType.trim()) return;
    try {
      await addPaymentType({ name: newPaymentType.trim() });
      setNewPaymentType("");
      toast({ title: "Payment type added" });
    } catch (error) {
      toast({ 
        variant: "destructive",
        title: "Error",
        description: "Failed to add payment type"
      });
    }
  };
  
  const handleRemovePaymentType = async (id: Id<"paymentTypes">) => {
    try {
      await removePaymentType({ id });
      toast({ title: "Payment type removed" });
    } catch (error) {
      toast({ 
        variant: "destructive",
        title: "Error",
        description: "Failed to remove payment type"
      });
    }
  };

  if (currentView === "navigation") {
    return (
      <div className="flex flex-col h-[calc(100vh-11rem)]">
        <div className="flex-1">
          <h2 className="text-2xl font-semibold mb-6">Settings</h2>
          <div className="grid gap-4">
            <Card
              onClick={() => setCurrentView("categories")}
              className="cursor-pointer transition-shadow hover:shadow-lg"
            >
              <div className="p-4">
                <div className="w-full flex flex-col items-start text-left gap-1">
                  <span className="font-medium">Modify Categories</span>
                  <span className="text-sm text-muted-foreground">Add, remove, or edit expense categories</span>
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
        <div className="mt-auto border-t pt-6">
          <SignOutButton />
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
          {currentView === "categories" ? "Categories" : "Payment Types"}
        </h2>
      </div>
      {currentView === "categories" ? (
        <>
          <div className="flex gap-2">
            <Input
              type="text"
              value={newCategory}
              onChange={e => setNewCategory(e.target.value)}
              placeholder="New category"
              className="flex-1"
            />
            <Button onClick={handleAddCategory}>
              Add
            </Button>
          </div>
          <div className="flex flex-col gap-2">
            {categories.map(category => (
              <Card key={category}>
                <CardContent className="flex items-center justify-between p-4">
                  <span>{category}</span>
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
        </>
      ) : (
        <>
          <div className="flex gap-2">
            <Input
              type="text"
              value={newPaymentType}
              onChange={e => setNewPaymentType(e.target.value)}
              placeholder="New payment type"
              className="flex-1"
            />
            <Button onClick={handleAddPaymentType}>
              Add
            </Button>
          </div>
          <div className="flex flex-col gap-2">
            {paymentTypes.map(paymentType => (
              <Card key={paymentType._id}>
                <CardContent className="flex items-center justify-between p-4">
                  <span>{paymentType.name}</span>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRemovePaymentType(paymentType._id)}
                  >
                    Remove
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
