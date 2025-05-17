import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Id } from "../../convex/_generated/dataModel";

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
  const transactionsData = useQuery(api.expenses.listAllTransactions);
  const categoriesData = useQuery(api.expenses.getCategoriesWithIds);
  const paymentTypesData = useQuery(api.expenses.getPaymentTypes);
  const updateExpense = useMutation(api.expenses.updateExpense);
  const deleteExpense = useMutation(api.expenses.deleteExpense);
  const { toast } = useToast();
  
  const [editingTransaction, setEditingTransaction] = useState<EditingTransaction | null>(null);
  const [amountError, setAmountError] = useState<string>("");
  
  const transactions = transactionsData ?? [];
  const categories = categoriesData ?? [];
  const paymentTypes = paymentTypesData ?? [];
  
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.map(transaction => (
            <div key={transaction._id} className="flex items-center justify-between gap-4 p-4 border rounded-lg">
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
                          {categories.map(c => (
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
                      step="0.01"
                      value={editingTransaction.amount}
                      onChange={handleAmountChange}
                      placeholder="0.00"
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
                  
                  <div className="flex gap-2">
                    <Button onClick={handleSaveEdit}>Save</Button>
                    <Button variant="outline" onClick={() => setEditingTransaction(null)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex-1">
                    <p className="font-medium">{transaction.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(transaction.date).toLocaleDateString()} • {getCategoryName(transaction.categoryId)} • {getPaymentTypeName(transaction.paymentTypeId)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">${transaction.amount.toFixed(2)}</p>
                    <Button variant="outline" size="sm" onClick={() => handleEdit(transaction)}>Edit</Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(transaction._id)}>Delete</Button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 