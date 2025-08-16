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
import { ArrowLeft, Trash2, CheckCircle, AlertCircle, Pencil } from "lucide-react";
import { useGesture } from "@use-gesture/react";
import { animated, useSpring } from "@react-spring/web";
 
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation, useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type ManageView = "transactions" | "recurring";

interface EditingTransaction {
  id: Id<"expenses">;
  date: Date;
  paymentTypeId: Id<"paymentTypes"> | undefined;
  categoryId: Id<"categories"> | undefined;
  description: string;
  amount: string;
  cuotas: number;
  transactionType: 'expense' | 'income';
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
  const hasVibratedLeft = useRef<Record<string, boolean>>({});
  const hasVibratedRight = useRef<Record<string, boolean>>({});
  const screenWidth = useRef<number>(window.innerWidth);
  const [isDetailsOpen, setIsDetailsOpen] = useState<boolean>(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any | null>(null);
  const [isDialogEditing, setIsDialogEditing] = useState<boolean>(false);
  const [isVerifyingAll, setIsVerifyingAll] = useState<boolean>(false);
  const [isDecliningAll, setIsDecliningAll] = useState<boolean>(false);
  // Recurring update prompt state
  const [isRecurringUpdatePromptOpen, setIsRecurringUpdatePromptOpen] = useState<boolean>(false);
  const [isUpdatingRecurring, setIsUpdatingRecurring] = useState<boolean>(false);
  type RecurringUpdates = {
    description?: string;
    amount?: number;
    categoryId?: Id<'categories'>;
    paymentTypeId?: Id<'paymentTypes'>;
    cuotas?: number;
  };
  const [pendingRecurringUpdate, setPendingRecurringUpdate] = useState<{
    id: Id<'recurringTransactions'>;
    updates: RecurringUpdates;
  } | null>(null);
  
  // Recurring transactions state & data
  const recurringTransactionsData = useQuery(api.recurring.listRecurringTransactions);
  const updateRecurring = useMutation(api.recurring.updateRecurringTransaction);
  const deleteRecurring = useMutation(api.recurring.deleteRecurringTransaction);
  const [isRecurringDetailsOpen, setIsRecurringDetailsOpen] = useState<boolean>(false);
  const [selectedRecurring, setSelectedRecurring] = useState<any | null>(null);
  const [isRecurringEditing, setIsRecurringEditing] = useState<boolean>(false);
  
  const transactions = transactionsData ?? [];
  const categories = categoriesData ?? [];
  const paymentTypes = paymentTypesData ?? [];
  const recurringTransactions = recurringTransactionsData ?? [];

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
  
  const openTransactionDetails = (transaction: any) => {
    setSelectedTransaction(transaction);
    setIsDetailsOpen(true);
    setIsDialogEditing(false);
    setAmountError("");
  };

  const startEditingDetails = () => {
    if (!selectedTransaction) return;
    setEditingTransaction({
      id: selectedTransaction._id,
      date: new Date(selectedTransaction.date),
      paymentTypeId: selectedTransaction.paymentTypeId,
      categoryId: selectedTransaction.categoryId,
      description: selectedTransaction.description,
      amount: selectedTransaction.amount.toString(),
      cuotas: selectedTransaction.cuotas,
      transactionType: selectedTransaction.transactionType,
    });
    setIsDialogEditing(true);
    setAmountError("");
  };

  const closeDetails = () => {
    setIsDetailsOpen(false);
    setIsDialogEditing(false);
    setEditingTransaction(null);
    setSelectedTransaction(null);
    setAmountError("");
  };
  
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmountError("");
    if (editingTransaction) {
      // Remove any non-digit characters
      const value = e.target.value.replace(/[^\d]/g, '');
      setEditingTransaction({ ...editingTransaction, amount: value });
    }
  };

  const formatAmount = (amount: number): string => {
    return amount.toLocaleString('en-US', { maximumFractionDigits: 0 });
  };

  const parseAmount = (value: string): number => {
    return parseInt(value.replace(/,/g, '')) || 0;
  };

  const handleSaveEdit = async () => {
    if (!editingTransaction) return;
    
    const amount = parseAmount(editingTransaction.amount);
    if (isNaN(amount) || amount <= 0) {
      setAmountError("Please enter a valid amount");
      return;
    }
    
    if (editingTransaction.transactionType === 'expense' && !editingTransaction.paymentTypeId) {
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
      // If this transaction came from a recurring template, offer to update that template
      if (selectedTransaction?.recurringTransactionId) {
        const updates: RecurringUpdates = {
          description: editingTransaction.description,
          amount,
          categoryId: editingTransaction.categoryId,
          cuotas: editingTransaction.cuotas,
        };
        if (editingTransaction.transactionType === 'expense') {
          updates.paymentTypeId = editingTransaction.paymentTypeId;
        }
        setPendingRecurringUpdate({
          id: selectedTransaction.recurringTransactionId as Id<'recurringTransactions'>,
          updates,
        });
        setIsRecurringUpdatePromptOpen(true);
      }

      toast({
        title: "Success",
        description: "Transaction updated successfully",
      });
      closeDetails();
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

  // ===== Recurring helpers =====
  interface EditingRecurring {
    id: Id<'recurringTransactions'>;
    description: string;
    amount: string;
    categoryId: Id<'categories'> | undefined;
    paymentTypeId: Id<'paymentTypes'> | undefined;
    transactionType: 'expense' | 'income';
    frequency: 'daily' | 'weekly' | 'monthly' | 'semestrally' | 'yearly';
    startDate: Date;
    endDate?: Date;
    cuotas: number;
  }
  const [editingRecurring, setEditingRecurring] = useState<EditingRecurring | null>(null);
  const [recAmountError, setRecAmountError] = useState<string>("");

  const openRecurringDetails = (rec: any) => {
    setSelectedRecurring(rec);
    setIsRecurringDetailsOpen(true);
    setIsRecurringEditing(false);
    setRecAmountError("");
  };

  const startEditingRecurring = () => {
    if (!selectedRecurring) return;
    setEditingRecurring({
      id: selectedRecurring._id,
      description: selectedRecurring.description,
      amount: selectedRecurring.amount.toString(),
      categoryId: selectedRecurring.categoryId,
      paymentTypeId: selectedRecurring.paymentTypeId,
      transactionType: selectedRecurring.transactionType,
      frequency: selectedRecurring.frequency,
      startDate: new Date(selectedRecurring.startDate),
      endDate: selectedRecurring.endDate ? new Date(selectedRecurring.endDate) : undefined,
      cuotas: selectedRecurring.cuotas ?? 1,
    });
    setIsRecurringEditing(true);
    setRecAmountError("");
  };

  const closeRecurringDetails = () => {
    setIsRecurringDetailsOpen(false);
    setIsRecurringEditing(false);
    setEditingRecurring(null);
    setSelectedRecurring(null);
    setRecAmountError("");
  };

  const handleRecurringAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRecAmountError("");
    if (editingRecurring) {
      const value = e.target.value.replace(/[^\d]/g, '');
      setEditingRecurring({ ...editingRecurring, amount: value });
    }
  };

  const handleSaveRecurring = async () => {
    if (!editingRecurring) return;
    const amount = parseAmount(editingRecurring.amount);
    if (isNaN(amount) || amount <= 0) {
      setRecAmountError("Please enter a valid amount");
      return;
    }
    if (editingRecurring.transactionType === 'expense' && !editingRecurring.paymentTypeId) {
      setRecAmountError("Please select a payment type");
      return;
    }
    if (!editingRecurring.categoryId) {
      setRecAmountError("Please select a category");
      return;
    }
    try {
      await updateRecurring({
        id: editingRecurring.id,
        description: editingRecurring.description,
        amount,
        categoryId: editingRecurring.categoryId,
        paymentTypeId: editingRecurring.transactionType === 'expense' ? editingRecurring.paymentTypeId : undefined,
        transactionType: editingRecurring.transactionType,
        frequency: editingRecurring.frequency,
        startDate: editingRecurring.startDate.getTime(),
        endDate: editingRecurring.endDate ? editingRecurring.endDate.getTime() : undefined,
        cuotas: editingRecurring.cuotas,
      });
      toast({ title: "Success", description: "Recurring transaction updated successfully" });
      closeRecurringDetails();
    } catch (error) {
      console.error("Error updating recurring:", error);
    }
  };

  const handleDeleteRecurring = async (id: Id<'recurringTransactions'>) => {
    try {
      await deleteRecurring({ id });
      toast({ title: "Success", description: "Recurring transaction deleted successfully" });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete recurring transaction" });
    }
  };

  const getDeleteZoneProgress = (x: number) => {
    // Linear from 0 to 30% of screen width while swiping left
    if (x >= 0) return 0;
    const max = screenWidth.current * 0.3;
    const progress = Math.min(Math.abs(x) / max, 1);
    return progress;
  };

  const getVerifyZoneProgress = (x: number) => {
    // Linear from 0 to 30% of screen width while swiping right (only on Unverified)
    if (currentTab !== "unverified") return 0;
    if (x <= 0) return 0;
    const max = screenWidth.current * 0.3;
    const progress = Math.min(x / max, 1);
    return progress;
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
        // Allow left swipe always (delete) and right swipe only on Unverified (verify)
        const maxLeft = -screenWidth.current * 0.4;
        const maxRight = currentTab === "unverified" ? screenWidth.current * 0.4 : 0;
        const newX = Math.max(maxLeft, Math.min(maxRight, x));
        swipePositions.current[id] = newX;
        setSwipeStates(prev => ({ ...prev, [id]: newX }));

        // Haptic feedback when crossing delete threshold (left)
        const leftThreshold = -screenWidth.current * 0.3;
        if (newX < leftThreshold && !hasVibratedLeft.current[id]) {
          triggerHapticFeedback();
          hasVibratedLeft.current[id] = true;
        } else if (newX >= leftThreshold) {
          hasVibratedLeft.current[id] = false;
        }

        // Haptic feedback when crossing verify threshold (right) on Unverified
        if (currentTab === "unverified") {
          const rightThreshold = screenWidth.current * 0.3;
          if (newX > rightThreshold && !hasVibratedRight.current[id]) {
            triggerHapticFeedback();
            hasVibratedRight.current[id] = true;
          } else if (newX <= rightThreshold) {
            hasVibratedRight.current[id] = false;
          }
        }
      } else {
        const leftThreshold = -screenWidth.current * 0.3;
        const rightThreshold = screenWidth.current * 0.3;
        // Trigger actions based on final swipe distance
        if (swipePositions.current[id] < leftThreshold) {
          handleDelete(id as Id<"expenses">);
        } else if (currentTab === "unverified" && swipePositions.current[id] > rightThreshold) {
          handleVerify(id as Id<"expenses">);
        }
        // Reset position and vibration flags
        swipePositions.current[id] = 0;
        setSwipeStates(prev => ({ ...prev, [id]: 0 }));
        hasVibratedLeft.current[id] = false;
        hasVibratedRight.current[id] = false;
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

  const handleVerifyAll = async () => {
    if (currentTab !== "unverified") return;
    const targets = filteredTransactions
      .filter((t) => t.verified === false)
      .map((t) => t._id as Id<"expenses">);
    if (targets.length === 0) return;
    setIsVerifyingAll(true);
    const results = await Promise.allSettled(targets.map((id) => verifyExpense({ id })));
    setIsVerifyingAll(false);
    const fulfilled = results.filter((r) => r.status === "fulfilled").length;
    const rejected = results.length - fulfilled;
    toast({
      title: "Verification complete",
      description: `${fulfilled} verified${rejected ? `, ${rejected} failed` : ""}`,
      variant: rejected ? "destructive" : "default",
    });
  };

  const handleDeclineAll = async () => {
    if (currentTab !== "unverified") return;
    const targets = filteredTransactions
      .filter((t) => t.verified === false)
      .map((t) => t._id as Id<"expenses">);
    if (targets.length === 0) return;
    setIsDecliningAll(true);
    const results = await Promise.allSettled(targets.map((id) => deleteExpense({ id })));
    setIsDecliningAll(false);
    const fulfilled = results.filter((r) => r.status === "fulfilled").length;
    const rejected = results.length - fulfilled;
    toast({
      title: "Decline complete",
      description: `${fulfilled} declined${rejected ? `, ${rejected} failed` : ""}`,
      variant: rejected ? "destructive" : "default",
    });
  };

  if (currentView === "transactions") {
    return (
      <div className="flex flex-col">
        <div className="flex-1">
          {/* Header is handled by App.tsx; only keep Tabs sticky under it */}
          <div className="sticky top-[72px] z-10 bg-background">
            <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="verified">Verified</TabsTrigger>
                <TabsTrigger value="unverified">Unverified</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="h-2" />
          </div>
          {currentTab === "unverified" && (
            <div className="w-full mb-2 flex justify-end">
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  onClick={handleDeclineAll}
                  disabled={
                    isDecliningAll ||
                    isVerifyingAll ||
                    filteredTransactions.filter((t) => t.verified === false).length === 0
                  }
                >
                  {isDecliningAll ? "Declining..." : "Decline all"}
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={handleVerifyAll}
                  disabled={
                    isVerifyingAll ||
                    isDecliningAll ||
                    filteredTransactions.filter((t) => t.verified === false).length === 0
                  }
                >
                  {isVerifyingAll ? "Verifying..." : "Verify all"}
                </Button>
              </div>
            </div>
          )}
          
          <div className="grid gap-4">
            {filteredTransactions.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  No transactions found.
                </CardContent>
              </Card>
            ) : (
              filteredTransactions.map((transaction) => (
                <div key={transaction._id as string} className="relative">
                  <div 
                    className="absolute inset-0 flex items-center justify-end pr-6 bg-red-500 text-white"
                    style={{
                      opacity: getDeleteZoneProgress(swipeStates[transaction._id as string] || 0),
                    }}
                  >
                    <Trash2 size={24} />
                  </div>
                  {currentTab === "unverified" && (
                    <div 
                      className="absolute inset-0 flex items-center justify-start pl-6 bg-green-500 text-white"
                      style={{
                        opacity: getVerifyZoneProgress(swipeStates[transaction._id as string] || 0),
                      }}
                    >
                      <CheckCircle size={24} />
                    </div>
                  )}
                  <animated.div
                    {...bindSwipe(transaction._id)}
                    style={{
                      transform: `translateX(${swipeStates[transaction._id as string] || 0}px)`,
                      touchAction: "pan-y",
                    }}
                  >
                    <Card onClick={() => openTransactionDetails(transaction)} className={cn(
                      "relative shadow-sm", 
                      transaction.transactionType === "expense" ? "border-l-4 border-l-red-500" : "border-l-4 border-l-green-500"
                    )}>
                      <CardContent className="p-4">
                        {false ? (
                          <div />
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
                                ${formatAmount(transaction.amount)}
                              </div>
                              <div className="flex gap-1 mt-1" />
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </animated.div>
                </div>
              ))
            )}
          </div>
        </div>
        {/* Transaction details dialog */}
        <Dialog open={isDetailsOpen} onOpenChange={(open) => { if (!open) closeDetails(); }}>
          <DialogContent className="w-[calc(100vw-2rem)] max-w-md p-4 rounded-xl border bg-card text-card-foreground sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Transaction details</DialogTitle>
              <DialogDescription>View details. Use the edit icon to modify.</DialogDescription>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto">
              {selectedTransaction && !isDialogEditing && (
                <div className="grid gap-3 pr-1">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">Description</div>
                    <div>{selectedTransaction.description}</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="font-medium">Date</div>
                    <div>{new Date(selectedTransaction.date).toLocaleDateString()}</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="font-medium">Category</div>
                    <div>{getCategoryName(selectedTransaction.categoryId)}</div>
                  </div>
                  {selectedTransaction.transactionType === 'expense' && (
                    <div className="flex items-center justify-between">
                      <div className="font-medium">Payment Type</div>
                      <div>{getPaymentTypeName(selectedTransaction.paymentTypeId)}</div>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="font-medium">Amount</div>
                    <div className={cn(selectedTransaction.transactionType === 'expense' ? 'text-red-500' : 'text-green-500')}>
                      {selectedTransaction.transactionType === 'expense' ? '-' : '+'} ${formatAmount(selectedTransaction.amount)}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="font-medium">Installments</div>
                    <div>{selectedTransaction.cuotas}</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="font-medium">Status</div>
                    <div>
                      {selectedTransaction.verified === false ? (
                        <Badge variant="outline" className="text-amber-500 border-amber-500">Unverified</Badge>
                      ) : (
                        <Badge variant="secondary">Verified</Badge>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {selectedTransaction && isDialogEditing && editingTransaction && (
                <div className="flex flex-col space-y-4 pr-1">
                  <div className="flex justify-between items-center">
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={editingTransaction.date.toISOString().substring(0, 10)}
                      onChange={(e) => setEditingTransaction({ ...editingTransaction, date: new Date(e.target.value) })}
                      className="max-w-[200px]"
                    />
                  </div>
                  {editingTransaction.transactionType === 'expense' && (
                    <div className="flex justify-between items-center">
                      <Label>Payment Type</Label>
                      <Select
                        value={editingTransaction.paymentTypeId?.toString() || ''}
                        onValueChange={(value) => setEditingTransaction({ ...editingTransaction, paymentTypeId: value as Id<'paymentTypes'> })}
                      >
                        <SelectTrigger className="max-w-[200px]"><SelectValue placeholder="Select payment type" /></SelectTrigger>
                        <SelectContent>
                          {paymentTypes.map((pt) => (
                            <SelectItem key={pt._id as string} value={pt._id as string}>{pt.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <Label>Category</Label>
                    <Select
                      value={editingTransaction.categoryId?.toString() || ''}
                      onValueChange={(value) => setEditingTransaction({ ...editingTransaction, categoryId: value as Id<'categories'> })}
                    >
                      <SelectTrigger className="max-w-[200px]"><SelectValue placeholder="Select category" /></SelectTrigger>
                      <SelectContent>
                        {categories
                          .filter((cat) => !cat.transactionType || cat.transactionType === editingTransaction.transactionType)
                          .map((cat) => (
                            <SelectItem key={cat._id as string} value={cat._id as string}>{cat.name}</SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-between items-center">
                    <Label>Description</Label>
                    <Input
                      value={editingTransaction.description}
                      onChange={(e) => setEditingTransaction({ ...editingTransaction, description: e.target.value })}
                      className="max-w-[200px]"
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <Label>Amount</Label>
                    <Input
                      type="text"
                      value={editingTransaction.amount.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      onChange={handleAmountChange}
                      className="max-w-[200px]"
                      inputMode="numeric"
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <Label>Installments</Label>
                    <Input
                      type="number"
                      min="1"
                      value={editingTransaction.cuotas}
                      onChange={(e) => setEditingTransaction({ ...editingTransaction, cuotas: parseInt(e.target.value) || 1 })}
                      className="max-w-[200px]"
                    />
                  </div>
                  {amountError && <div className="text-red-500 text-sm">{amountError}</div>}
                </div>
              )}
            </div>

            {selectedTransaction && (
              <div className="mt-4 flex items-center justify-between">
                <Button
                  variant="destructive"
                  onClick={async () => {
                    await handleDelete(selectedTransaction._id);
                    closeDetails();
                  }}
                >
                  Delete
                </Button>
                <div className="flex gap-2">
                  {isDialogEditing ? (
                    <>
                      <Button variant="outline" onClick={() => { setIsDialogEditing(false); setEditingTransaction(null); setAmountError(''); }}>Cancel</Button>
                      <Button onClick={handleSaveEdit}>Save</Button>
                    </>
                  ) : (
                    <Button onClick={startEditingDetails}>Edit</Button>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
        {/* Prompt to update the related recurring template after editing a generated transaction */}
        <Dialog open={isRecurringUpdatePromptOpen} onOpenChange={(open) => { if (!open) { setIsRecurringUpdatePromptOpen(false); setPendingRecurringUpdate(null); } }}>
          <DialogContent className="w-[calc(100vw-2rem)] max-w-md p-4 rounded-xl border bg-card text-card-foreground sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Update recurring template?</DialogTitle>
              <DialogDescription>
                Apply these changes to the recurring transaction so future occurrences are created with the same updates.
              </DialogDescription>
            </DialogHeader>
            <div className="text-sm text-muted-foreground">
              This will not change past transactions.
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => { setIsRecurringUpdatePromptOpen(false); setPendingRecurringUpdate(null); }}
                disabled={isUpdatingRecurring}
              >
                Not now
              </Button>
              <Button
                onClick={async () => {
                  if (!pendingRecurringUpdate) return;
                  setIsUpdatingRecurring(true);
                  try {
                    await updateRecurring({ id: pendingRecurringUpdate.id, ...pendingRecurringUpdate.updates });
                    toast({ title: "Success", description: "Recurring template updated" });
                  } catch (err) {
                    toast({ variant: "destructive", title: "Error", description: "Failed to update recurring template" });
                  } finally {
                    setIsUpdatingRecurring(false);
                    setIsRecurringUpdatePromptOpen(false);
                    setPendingRecurringUpdate(null);
                  }
                }}
                disabled={isUpdatingRecurring}
              >
                {isUpdatingRecurring ? "Updating..." : "Update template"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Header handled by App.tsx */}
      <div className="grid gap-4">
        {(recurringTransactions ?? []).length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              No recurring transactions found.
            </CardContent>
          </Card>
        ) : (
          (recurringTransactions ?? []).map((rec) => (
            <Card
              key={rec._id as string}
              onClick={() => openRecurringDetails(rec)}
              className={cn(
                "relative shadow-sm cursor-pointer",
                rec.transactionType === "expense" ? "border-l-4 border-l-red-500" : "border-l-4 border-l-green-500",
                rec.isActive === false ? "opacity-70" : ""
              )}
            >
              <CardContent className="p-4">
                <div className="flex justify-between">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{rec.description}</span>
                      {rec.isActive === false && (
                        <Badge variant="outline" className="text-amber-500 border-amber-500">Inactive</Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(rec.startDate).toLocaleDateString()} • {rec.frequency} • {getCategoryName(rec.categoryId)}{rec.transactionType === 'expense' ? ` • ${getPaymentTypeName(rec.paymentTypeId)}` : ''}
                    </div>
                    {(rec.cuotas ?? 1) > 1 && (
                      <div className="text-xs text-gray-500 mt-1">Installments: {rec.cuotas}</div>
                    )}
                  </div>
                  <div className="flex flex-col items-end">
                    <div className={cn(
                      "font-semibold",
                      rec.transactionType === "expense" ? "text-red-500" : "text-green-500"
                    )}>
                      {rec.transactionType === "expense" ? "-" : "+"}${formatAmount(rec.amount)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Recurring details dialog */}
      <Dialog open={isRecurringDetailsOpen} onOpenChange={(open) => { if (!open) closeRecurringDetails(); }}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-md p-4 rounded-xl border bg-card text-card-foreground sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Recurring transaction details</DialogTitle>
            <DialogDescription>View details. Use the edit button to modify.</DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            {selectedRecurring && !isRecurringEditing && (
              <div className="grid gap-3 pr-1">
                <div className="flex items-center justify-between"><div className="font-medium">Description</div><div>{selectedRecurring.description}</div></div>
                <div className="flex items-center justify-between"><div className="font-medium">Start Date</div><div>{new Date(selectedRecurring.startDate).toLocaleDateString()}</div></div>
                <div className="flex items-center justify-between"><div className="font-medium">End Date</div><div>{selectedRecurring.endDate ? new Date(selectedRecurring.endDate).toLocaleDateString() : '-'}</div></div>
                <div className="flex items-center justify-between"><div className="font-medium">Frequency</div><div>{selectedRecurring.frequency}</div></div>
                <div className="flex items-center justify-between"><div className="font-medium">Type</div><div>{selectedRecurring.transactionType}</div></div>
                <div className="flex items-center justify-between"><div className="font-medium">Category</div><div>{getCategoryName(selectedRecurring.categoryId)}</div></div>
                {selectedRecurring.transactionType === 'expense' && (
                  <div className="flex items-center justify-between"><div className="font-medium">Payment Type</div><div>{getPaymentTypeName(selectedRecurring.paymentTypeId)}</div></div>
                )}
                <div className="flex items-center justify-between"><div className="font-medium">Amount</div><div className={cn(selectedRecurring.transactionType === 'expense' ? 'text-red-500' : 'text-green-500')}>
                  {selectedRecurring.transactionType === 'expense' ? '-' : '+'} ${formatAmount(selectedRecurring.amount)}
                </div></div>
                <div className="flex items-center justify-between"><div className="font-medium">Installments</div><div>{selectedRecurring.cuotas ?? 1}</div></div>
                <div className="flex items-center justify-between"><div className="font-medium">Status</div><div>{selectedRecurring.isActive ? <Badge variant="secondary">Active</Badge> : <Badge variant="outline" className="text-amber-500 border-amber-500">Inactive</Badge>}</div></div>
              </div>
            )}

            {selectedRecurring && isRecurringEditing && editingRecurring && (
              <div className="flex flex-col space-y-4 pr-1">
                <div className="flex justify-between items-center">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={editingRecurring.startDate.toISOString().substring(0, 10)}
                    onChange={(e) => setEditingRecurring({ ...editingRecurring, startDate: new Date(e.target.value) })}
                    className="max-w-[200px]"
                  />
                </div>
                <div className="flex justify-between items-center">
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={editingRecurring.endDate ? editingRecurring.endDate.toISOString().substring(0, 10) : ''}
                    onChange={(e) => setEditingRecurring({ ...editingRecurring, endDate: e.target.value ? new Date(e.target.value) : undefined })}
                    className="max-w-[200px]"
                  />
                </div>
                <div className="flex justify-between items-center">
                  <Label>Frequency</Label>
                  <Select
                    value={editingRecurring.frequency}
                    onValueChange={(value) => setEditingRecurring({ ...editingRecurring, frequency: value as EditingRecurring['frequency'] })}
                  >
                    <SelectTrigger className="max-w-[200px]"><SelectValue placeholder="Select frequency" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="semestrally">Semestrally</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-between items-center">
                  <Label>Type</Label>
                  <Select
                    value={editingRecurring.transactionType}
                    onValueChange={(value) => setEditingRecurring({ ...editingRecurring, transactionType: value as 'expense' | 'income', paymentTypeId: value === 'income' ? undefined : editingRecurring.paymentTypeId })}
                  >
                    <SelectTrigger className="max-w-[200px]"><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="expense">Expense</SelectItem>
                      <SelectItem value="income">Income</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {editingRecurring.transactionType === 'expense' && (
                  <div className="flex justify-between items-center">
                    <Label>Payment Type</Label>
                    <Select
                      value={editingRecurring.paymentTypeId?.toString() || ''}
                      onValueChange={(value) => setEditingRecurring({ ...editingRecurring, paymentTypeId: value as Id<'paymentTypes'> })}
                    >
                      <SelectTrigger className="max-w-[200px]"><SelectValue placeholder="Select payment type" /></SelectTrigger>
                      <SelectContent>
                        {paymentTypes.map((pt) => (
                          <SelectItem key={pt._id as string} value={pt._id as string}>{pt.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <Label>Category</Label>
                  <Select
                    value={editingRecurring.categoryId?.toString() || ''}
                    onValueChange={(value) => setEditingRecurring({ ...editingRecurring, categoryId: value as Id<'categories'> })}
                  >
                    <SelectTrigger className="max-w-[200px]"><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      {categories
                        .filter((cat) => !cat.transactionType || cat.transactionType === editingRecurring.transactionType)
                        .map((cat) => (
                          <SelectItem key={cat._id as string} value={cat._id as string}>{cat.name}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-between items-center">
                  <Label>Description</Label>
                  <Input
                    value={editingRecurring.description}
                    onChange={(e) => setEditingRecurring({ ...editingRecurring, description: e.target.value })}
                    className="max-w-[200px]"
                  />
                </div>
                <div className="flex justify-between items-center">
                  <Label>Amount</Label>
                  <Input
                    type="text"
                    value={editingRecurring.amount.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    onChange={handleRecurringAmountChange}
                    className="max-w-[200px]"
                    inputMode="numeric"
                  />
                </div>
                <div className="flex justify-between items-center">
                  <Label>Installments</Label>
                  <Input
                    type="number"
                    min="1"
                    value={editingRecurring.cuotas}
                    onChange={(e) => setEditingRecurring({ ...editingRecurring, cuotas: parseInt(e.target.value) || 1 })}
                    className="max-w-[200px]"
                  />
                </div>
                {recAmountError && <div className="text-red-500 text-sm">{recAmountError}</div>}
              </div>
            )}
          </div>

          {selectedRecurring && (
            <div className="mt-4 flex items-center justify-between">
              <Button
                variant="destructive"
                onClick={async () => {
                  await handleDeleteRecurring(selectedRecurring._id);
                  closeRecurringDetails();
                }}
              >
                Delete
              </Button>
              <div className="flex gap-2">
                {isRecurringEditing ? (
                  <>
                    <Button variant="outline" onClick={() => { setIsRecurringEditing(false); setEditingRecurring(null); setRecAmountError(''); }}>Cancel</Button>
                    <Button onClick={handleSaveRecurring}>Save</Button>
                  </>
                ) : (
                  <Button onClick={startEditingRecurring}>Edit</Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 