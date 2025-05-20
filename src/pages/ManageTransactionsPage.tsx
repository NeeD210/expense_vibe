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
import { ArrowLeft, Trash2, CheckCircle, AlertCircle } from "lucide-react";
import { useGesture } from "@use-gesture/react";
import { animated, useSpring } from "@react-spring/web";
import RecurringTransactionList from "@/components/recurring/RecurringTransactionList";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation, useNavigate } from "react-router-dom";

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
  const [currentView, setCurrentView] = useState<ManageView>("transactions");
  const [currentTab, setCurrentTab] = useState("all");
  const transactionsData = useQuery(api.expenses.listAllTransactions);
  const categoriesData = useQuery(api.expenses.getCategoriesWithIdsIncludingDeleted);
  const paymentTypesData = useQuery(api.expenses.getHistoricPaymentTypes);
  const updateExpense = useMutation(api.expenses.updateExpense);
  const deleteExpense = useMutation(api.expenses.deleteExpense);
  const verifyExpense = useMutation(api.expenses.verifyExpense);
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  
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
    // Set the current view based on the route
    if (location.pathname === "/transactions/recurring") {
      setCurrentView("recurring");
    } else {
      setCurrentView("transactions");
    }
  }, [location.pathname]);
  
  // Filter transactions based on the selected tab
  const filteredTransactions = transactions.filter(transaction => {
    if (currentTab === "unverified") {
      return transaction.verified === false;
    }
    if (currentTab === "verified") {
      return transaction.verified === true;
    }
    return true; // "all" tab
  });
  
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
    const threshold = -screenWidth.current * 0.2; // 30% of screen width
    const max = -screenWidth.current * 0.3; // 40% of screen width
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

  const handleVerify = async (id: Id<"expenses">) => {
    try {
      await verifyExpense({ id });
      toast({
        title: "Success",
        description: "Transaction verified successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to verify transaction",
      });
    }
  };

  if (currentView === "transactions") {
    return (
      <div className="flex flex-col h-[calc(100vh-11rem)]">
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/transactions")}
              className="rounded-full"
            >
              <ArrowLeft size={20} />
            </Button>
            <h1 className="text-2xl font-bold">Transactions</h1>
          </div>
          
          <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full mb-4">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="verified">Verified</TabsTrigger>
              <TabsTrigger value="unverified">Unverified</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="grid gap-4">
            {filteredTransactions.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  No transactions found.
                </CardContent>
              </Card>
            ) : (
              filteredTransactions.map((transaction) => (
                <animated.div
                  key={transaction._id as string}
                  {...bindSwipe(transaction._id)}
                  style={{
                    x: swipeStates[transaction._id as string] || 0,
                    touchAction: "pan-y",
                  }}
                >
                  <div className="relative">
                    <div 
                      className="absolute inset-0 flex items-center justify-end pr-6 bg-red-500 text-white"
                      style={{
                        opacity: getDeleteZoneProgress(swipeStates[transaction._id as string] || 0),
                      }}
                    >
                      <Trash2 size={24} />
                    </div>
                    <Card className={cn(
                      "relative shadow-sm", 
                      transaction.transactionType === "expense" ? "border-l-4 border-l-red-500" : "border-l-4 border-l-green-500"
                    )}>
                      <CardContent className="p-4">
                        {editingTransaction?.id === transaction._id ? (
                          <div className="flex flex-col space-y-4">
                            <div className="flex justify-between items-center">
                              <Label>Date</Label>
                              <Input
                                type="date"
                                value={editingTransaction.date.toISOString().substring(0, 10)}
                                onChange={(e) => setEditingTransaction({
                                  ...editingTransaction,
                                  date: new Date(e.target.value),
                                })}
                                className="max-w-[200px]"
                              />
                            </div>
                            
                            <div className="flex justify-between items-center">
                              <Label>Payment Type</Label>
                              <Select
                                value={editingTransaction.paymentTypeId?.toString() || ""}
                                onValueChange={(value) => setEditingTransaction({
                                  ...editingTransaction,
                                  paymentTypeId: value as Id<"paymentTypes">,
                                })}
                              >
                                <SelectTrigger className="max-w-[200px]">
                                  <SelectValue placeholder="Select payment type" />
                                </SelectTrigger>
                                <SelectContent>
                                  {paymentTypes.map((pt) => (
                                    <SelectItem key={pt._id as string} value={pt._id as string}>
                                      {pt.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="flex justify-between items-center">
                              <Label>Category</Label>
                              <Select
                                value={editingTransaction.categoryId?.toString() || ""}
                                onValueChange={(value) => setEditingTransaction({
                                  ...editingTransaction,
                                  categoryId: value as Id<"categories">,
                                })}
                              >
                                <SelectTrigger className="max-w-[200px]">
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                  {categories
                                    .filter(cat => !cat.transactionType || cat.transactionType === transaction.transactionType)
                                    .map((cat) => (
                                      <SelectItem key={cat._id as string} value={cat._id as string}>
                                        {cat.name}
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="flex justify-between items-center">
                              <Label>Description</Label>
                              <Input
                                value={editingTransaction.description}
                                onChange={(e) => setEditingTransaction({
                                  ...editingTransaction,
                                  description: e.target.value,
                                })}
                                className="max-w-[200px]"
                              />
                            </div>
                            
                            <div className="flex justify-between items-center">
                              <Label>Amount</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={editingTransaction.amount}
                                onChange={handleAmountChange}
                                className="max-w-[200px]"
                              />
                            </div>
                            
                            <div className="flex justify-between items-center">
                              <Label>Installments</Label>
                              <Input
                                type="number"
                                min="1"
                                value={editingTransaction.cuotas}
                                onChange={(e) => setEditingTransaction({
                                  ...editingTransaction,
                                  cuotas: parseInt(e.target.value) || 1,
                                })}
                                className="max-w-[200px]"
                              />
                            </div>
                            
                            {amountError && (
                              <div className="text-red-500 text-sm">{amountError}</div>
                            )}
                            
                            <div className="flex justify-end space-x-2 pt-2">
                              <Button variant="outline" onClick={() => {
                                setEditingTransaction(null);
                                setAmountError("");
                              }}>
                                Cancel
                              </Button>
                              <Button onClick={handleSaveEdit}>
                                Save
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-between">
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">{transaction.description}</span>
                                {transaction.verified === false && (
                                  <Badge variant="outline" className="text-amber-500 border-amber-500">
                                    <AlertCircle className="h-3 w-3 mr-1" />
                                    Unverified
                                  </Badge>
                                )}
                                {transaction.recurringTransactionId && (
                                  <Badge variant="secondary" className="text-xs">
                                    Recurring
                                  </Badge>
                                )}
                              </div>
                              <div className="text-sm text-gray-500">
                                {new Date(transaction.date).toLocaleDateString()} • 
                                {getCategoryName(transaction.categoryId)} • 
                                {getPaymentTypeName(transaction.paymentTypeId)}
                              </div>
                              {transaction.cuotas > 1 && (
                                <div className="text-xs text-gray-500 mt-1">
                                  Installments: {transaction.cuotas}
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col items-end">
                              <div className={cn(
                                "font-semibold",
                                transaction.transactionType === "expense" ? "text-red-500" : "text-green-500"
                              )}>
                                {transaction.transactionType === "expense" ? "-" : "+"} 
                                ${transaction.amount.toFixed(2)}
                              </div>
                              <div className="flex gap-1 mt-1">
                                {transaction.verified === false && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2 text-green-500 hover:text-green-700"
                                    onClick={() => handleVerify(transaction._id)}
                                    title="Verify"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2"
                                  onClick={() => handleEdit(transaction)}
                                  title="Edit"
                                >
                                  Edit
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </animated.div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-11rem)]">
      <div className="flex items-center mb-4">
        <Button
          variant="ghost"
          size="sm"
          className="mr-2"
          onClick={() => navigate("/transactions")}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">Recurring Transactions</h1>
      </div>
      
      <RecurringTransactionList />
    </div>
  );
} 