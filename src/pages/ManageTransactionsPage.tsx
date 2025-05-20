import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Id } from "../../convex/_generated/dataModel";
import { ArrowLeft, Trash2 } from "lucide-react";
import { useGesture } from "@use-gesture/react";
import { animated, useSpring } from "@react-spring/web";

type ManageView = "transactions" | "recurring";

interface EditingTransaction {
  id: Id<"expenses">;
  date: Date;
  paymentTypeId: Id<"paymentTypes"> | undefined;
  categoryId: Id<"categories"> | undefined;
  description: string;
  amount: string;
  cuotas: number;
}

export default function ManageTransactionsPage() {
  const [currentView, setCurrentView] = useState<ManageView>("recurring");
  const transactionsData = useQuery(api.expenses.listAllTransactions);
  const categoriesData = useQuery(api.expenses.getCategoriesWithIdsIncludingDeleted);
  const paymentTypesData = useQuery(api.expenses.getPaymentTypes);
  const updateExpense = useMutation(api.expenses.updateExpense);
  const deleteExpense = useMutation(api.expenses.deleteExpense);
  const { toast } = useToast();
  
  const [editingTransaction, setEditingTransaction] = useState<EditingTransaction | null>(null);
  const [amountError, setAmountError] = useState<string>("");
  const swipePositions = useRef<Record<string, number>>({});
  const [swipeStates, setSwipeStates] = useState<Record<string, number>>({});
  const hasVibrated = useRef<Record<string, boolean>>({});
  const screenWidth = useRef<number>(window.innerWidth);
  
  const transactions = transactionsData ?? [];
  const categories = categoriesData ?? [];
  const paymentTypes = paymentTypesData ?? [];
  
  useEffect(() => {
    const handleResize = () => {
      screenWidth.current = window.innerWidth;
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const handleEdit = (transaction: any) => {
    setEditingTransaction({
      id: transaction._id,
      date: new Date(transaction.date),
      paymentTypeId: transaction.paymentTypeId,
      categoryId: transaction.categoryId,
      description: transaction.description,
      amount: transaction.amount.toString(),
      cuotas: transaction.cuotas,
    });
  };
  
  const handleSaveEdit = async () => {
    if (!editingTransaction) return;
    
    const amount = parseFloat(editingTransaction.amount);
    if (isNaN(amount) || amount <= 0) {
      setAmountError("Please enter a valid amount");
      return;
    }
    
    if (!editingTransaction.paymentTypeId) {
      setAmountError("Please select a payment type");
      return;
    }

    if (!editingTransaction.categoryId) {
      setAmountError("Please select a category");
      return;
    }
    
    try {
      await updateExpense({
        id: editingTransaction.id,
        date: editingTransaction.date.getTime(),
        paymentTypeId: editingTransaction.paymentTypeId,
        categoryId: editingTransaction.categoryId,
        description: editingTransaction.description,
        amount,
        cuotas: editingTransaction.cuotas,
      });
      
      toast({
        title: "Success",
        description: "Transaction updated successfully",
      });
      setEditingTransaction(null);
      setAmountError("");
    } catch (error) {
      console.error("Error updating expense:", error);
    }
  };
  
  const handleDelete = async (id: Id<"expenses">) => {
    try {
      await deleteExpense({ id });
      toast({
        title: "Success",
        description: "Transaction deleted successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete transaction",
      });
    }
  };
  
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmountError("");
    if (editingTransaction) {
      setEditingTransaction({ ...editingTransaction, amount: e.target.value });
    }
  };

  const getPaymentTypeName = (paymentTypeId: Id<"paymentTypes"> | undefined) => {
    if (!paymentTypeId) return "";
    const paymentType = paymentTypes.find(pt => pt._id === paymentTypeId);
    return paymentType?.name ?? "";
  };

  const getCategoryName = (categoryId: Id<"categories"> | undefined) => {
    if (!categoryId) return "";
    const category = categories.find(c => c._id === categoryId);
    return category?.name ?? "";
  };

  const getDeleteZoneProgress = (x: number) => {
    const threshold = -screenWidth.current * 0.3; // 30% of screen width
    const max = -screenWidth.current * 0.4; // 40% of screen width
    if (x > threshold) return 0;
    if (x < max) return 1;
    return (x - threshold) / (max - threshold);
  };

  const triggerHapticFeedback = () => {
    if ('vibrate' in navigator) {
      // Short vibration (50ms)
      navigator.vibrate(50);
    }
  };

  const bindSwipe = useGesture({
    onDrag: ({ movement: [x], down, args: [id] }) => {
      if (down) {
        // Only allow left swipe and cap at 40% of screen width
        const maxSwipe = -screenWidth.current * 0.4;
        const newX = Math.max(maxSwipe, Math.min(0, x));
        swipePositions.current[id] = newX;
        setSwipeStates(prev => ({ ...prev, [id]: newX }));

        // Trigger haptic feedback when crossing threshold (30% of screen width)
        const threshold = -screenWidth.current * 0.3;
        if (newX < threshold && !hasVibrated.current[id]) {
          triggerHapticFeedback();
          hasVibrated.current[id] = true;
        } else if (newX >= threshold) {
          hasVibrated.current[id] = false;
        }
      } else {
        // If swiped far enough (30% of screen width), trigger delete
        const threshold = -screenWidth.current * 0.3;
        if (swipePositions.current[id] < threshold) {
          handleDelete(id as Id<"expenses">);
        }
        // Reset position
        swipePositions.current[id] = 0;
        setSwipeStates(prev => ({ ...prev, [id]: 0 }));
        hasVibrated.current[id] = false;
      }
    }
  });

  if (currentView === "recurring") {
    return (
      <div className="flex flex-col h-[calc(100vh-11rem)]">
        <div className="flex-1">
          <div className="grid gap-4">
            <Card
              onClick={() => setCurrentView("transactions")}
              className="cursor-pointer transition-shadow hover:shadow-lg"
            >
              <div className="p-4">
                <div className="w-full flex flex-col items-start text-left gap-1">
                  <span className="font-medium">Transactions</span>
                  <span className="text-sm text-muted-foreground">View and manage your transactions</span>
                </div>
              </div>
            </Card>
            <Card
              onClick={() => setCurrentView("recurring")}
              className="cursor-pointer transition-shadow hover:shadow-lg"
            >
              <div className="p-4">
                <div className="w-full flex flex-col items-start text-left gap-1">
                  <span className="font-medium">Recurring</span>
                  <span className="text-sm text-muted-foreground">Manage your recurring transactions</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-11rem)]">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            if (editingTransaction) {
              setEditingTransaction(null);
            } else {
              setCurrentView("recurring");
            }
          }}
          className="rounded-full"
        >
          <ArrowLeft size={20} />
        </Button>
        <h2 className="text-2xl font-semibold">
          Transactions
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-4">
          {transactions.map(transaction => {
            const progress = getDeleteZoneProgress(swipeStates[transaction._id] || 0);
            const scale = 1 + (progress * 0.2); // Scale up to 1.2x
            const bgColor = `rgb(${220 + (progress * 35)}, ${38 + (progress * 17)}, ${38 + (progress * 17)})`; // Darker red

            return (
              <div key={transaction._id} className="relative overflow-hidden">
                <animated.div
                  {...bindSwipe(transaction._id)}
                  style={{
                    x: swipeStates[transaction._id] || 0,
                    touchAction: 'pan-y pinch-zoom'
                  }}
                  className="flex items-center justify-between gap-4 p-4 border rounded-lg bg-background relative z-10"
                >
                  {editingTransaction?.id === transaction._id ? (
                    <div className="flex-1 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="date">Date</Label>
                          <Input
                            id="date"
                            type="date"
                            value={editingTransaction.date.toISOString().split('T')[0]}
                            onChange={e => {
                              const newDate = new Date(e.target.value);
                              newDate.setUTCHours(12, 0, 0, 0);
                              setEditingTransaction({ ...editingTransaction, date: newDate });
                            }}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="category">Category</Label>
                          <Select 
                            value={editingTransaction.categoryId} 
                            onValueChange={value => setEditingTransaction({ ...editingTransaction, categoryId: value as Id<"categories"> })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                            <SelectContent>
                              {categories
                                .filter(c => c.transactionType === transaction.transactionType)
                                .map(c => (
                                <SelectItem key={c._id} value={c._id}>
                                  {c.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="paymentType">Payment Type</Label>
                        <Select 
                          value={editingTransaction.paymentTypeId} 
                          onValueChange={(value) => setEditingTransaction({ ...editingTransaction, paymentTypeId: value as Id<"paymentTypes"> | undefined })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a payment type" />
                          </SelectTrigger>
                          <SelectContent>
                            {paymentTypes.map(pt => (
                              <SelectItem key={pt._id} value={pt._id}>
                                {pt.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Input
                          id="description"
                          type="text"
                          value={editingTransaction.description}
                          onChange={e => setEditingTransaction({ ...editingTransaction, description: e.target.value })}
                          placeholder="Enter description"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="amount" className={cn(amountError && "text-destructive")}>
                          Amount
                        </Label>
                        <Input
                          id="amount"
                          type="number"
                          step="1"
                          value={editingTransaction.amount}
                          onChange={handleAmountChange}
                          placeholder="0"
                          className={cn(
                            amountError && "border-destructive focus-visible:ring-destructive"
                          )}
                        />
                        {amountError && (
                          <p className="text-sm text-destructive">
                            {amountError}
                          </p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="cuotas">Cuotas</Label>
                        <Input
                          id="cuotas"
                          type="number"
                          value={editingTransaction.cuotas}
                          onChange={(e) =>
                            setEditingTransaction({
                              ...editingTransaction,
                              cuotas: parseInt(e.target.value) || 0,
                            })
                          }
                        />
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <Button 
                          variant="destructive" 
                          onClick={() => {
                            handleDelete(editingTransaction.id);
                            setEditingTransaction(null);
                          }}
                        >
                          Delete
                        </Button>
                        <div className="flex gap-2">
                          <Button variant="outline" onClick={() => setEditingTransaction(null)}>Cancel</Button>
                          <Button onClick={handleSaveEdit}>Save</Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div 
                        className="flex-1 cursor-pointer hover:bg-accent/50 p-2 rounded-md transition-colors"
                        onClick={() => handleEdit(transaction)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-foreground">{getCategoryName(transaction.categoryId)}</div>
                            <div className="text-sm text-muted-foreground">{transaction.description}</div>
                            <div className="text-xs text-muted-foreground/70">
                              {new Date(transaction.date).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={cn(
                              "font-medium",
                              transaction.transactionType === 'income' ? 'text-green-600' : 'text-foreground'
                            )}>
                              {transaction.transactionType === 'income' ? '+' : ''}${Math.round(transaction.amount)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {getPaymentTypeName(transaction.paymentTypeId)}
                              {transaction.cuotas && transaction.cuotas > 1 && ` - ${transaction.cuotas} cuota${transaction.cuotas > 1 ? 's' : ''}`}
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </animated.div>
                <div 
                  className="absolute inset-0 flex items-center justify-end pr-4 text-destructive-foreground rounded-lg transition-colors"
                  style={{ backgroundColor: bgColor }}
                >
                  <animated.div style={{ transform: `scale(${scale})` }}>
                    <Trash2 className="h-6 w-6" />
                  </animated.div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
} 