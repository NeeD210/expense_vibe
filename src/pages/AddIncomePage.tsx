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

export default function AddIncomePage() {
  const categoriesData = useQuery(api.expenses.getCategories);
  const paymentTypesData = useQuery(api.expenses.getPaymentTypes);
  
  const categories = categoriesData ?? [];
  const paymentTypes = paymentTypesData ?? [];
  const addExpense = useMutation(api.expenses.addExpense);
  const { toast } = useToast();
  
  const [date, setDate] = useState(new Date());
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [amountError, setAmountError] = useState(false);
  const [paymentTypeId, setPaymentTypeId] = useState<Id<"paymentTypes"> | "">("");
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate amount
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      setAmountError(true);
      toast({
        variant: "destructive",
        title: "Invalid Amount",
        description: "Please enter a valid amount",
      });
      return;
    }
    
    // Ensure we have valid values before submitting
    const finalCategory = category || categories[0] || "";
    const finalPaymentTypeId = paymentTypeId || (paymentTypes[0]?._id ?? "");
    
    if (!finalPaymentTypeId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No payment types available",
      });
      return;
    }

    if (!finalCategory) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a category",
      });
      return;
    }
    
    try {
      await addExpense({
        date: date.getTime(),
        paymentTypeId: finalPaymentTypeId,
        category: finalCategory,
        description,
        amount: parseFloat(amount),
        cuotas: 1,
        transactionType: "income",
      });
      
      toast({
        title: "Success",
        description: "Income added successfully",
      });
      setDescription("");
      setAmount("");
      setAmountError(false);
    } catch (error) {
      console.error("Failed to add income:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add income. Please try again.",
      });
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAmount(value);
    // Clear error when user starts typing
    if (amountError) {
      setAmountError(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Income</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date.toISOString().split('T')[0]}
              onChange={e => {
                const newDate = new Date(e.target.value);
                newDate.setUTCHours(12, 0, 0, 0);
                setDate(newDate);
              }}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(c => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="paymentType">Payment Type</Label>
            <Select 
              value={paymentTypeId} 
              onValueChange={(value) => setPaymentTypeId(value as Id<"paymentTypes"> | "")}
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
              value={description}
              onChange={e => setDescription(e.target.value)}
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
              value={amount}
              onChange={handleAmountChange}
              placeholder="0.00"
              className={cn(
                amountError && "border-destructive focus-visible:ring-destructive"
              )}
            />
            {amountError && (
              <p className="text-sm text-destructive">
                Please enter a valid amount greater than 0
              </p>
            )}
          </div>
          
          <Button type="submit" className="w-full">
            Add Income
          </Button>
        </form>
      </CardContent>
    </Card>
  );
} 