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
  const categoriesData = useQuery(api.expenses.getCategoriesWithIds);
  const paymentTypesData = useQuery(api.expenses.getPaymentTypes);
  
  const categories = categoriesData ?? [];
  const paymentTypes = paymentTypesData ?? [];
  const addExpense = useMutation(api.expenses.addExpense);
  const { toast } = useToast();
  
  const [date, setDate] = useState(new Date());
  const [categoryId, setCategoryId] = useState<Id<"categories"> | "">("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [amountError, setAmountError] = useState(false);
  const [paymentTypeId, setPaymentTypeId] = useState<Id<"paymentTypes"> | "">("");
  
  // Format amount with $ and thousands separators
  const formatAmount = (value: string) => {
    // Remove any non-digit characters except decimal point
    const numericValue = value.replace(/[^\d.]/g, '');
    
    // Handle empty input
    if (!numericValue) return '';
    
    // Split into dollars and cents
    const parts = numericValue.split('.');
    const dollars = parts[0];
    const cents = parts[1] || '';
    
    // Format dollars with commas
    const formattedDollars = dollars.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    
    // Combine with cents if present
    return `$${formattedDollars}${cents ? `.${cents}` : ''}`;
  };

  // Parse formatted amount back to number
  const parseAmount = (formattedValue: string) => {
    return parseFloat(formattedValue.replace(/[$,]/g, ''));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate amount
    const numericAmount = parseAmount(amount);
    if (!amount || isNaN(numericAmount) || numericAmount <= 0) {
      setAmountError(true);
      toast({
        variant: "destructive",
        title: "Invalid Amount",
        description: "Please enter a valid amount",
      });
      return;
    }
    
    // Ensure we have valid values before submitting
    const finalCategoryId = categoryId || (categories[0]?._id ?? "");
    const finalPaymentTypeId = paymentTypeId || (paymentTypes[0]?._id ?? "");
    
    if (!finalPaymentTypeId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No payment types available",
      });
      return;
    }

    if (!finalCategoryId) {
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
        categoryId: finalCategoryId,
        description,
        amount: numericAmount,
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
    setAmount(formatAmount(value));
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
            <Select value={categoryId} onValueChange={(value) => setCategoryId(value as Id<"categories"> | "")}>
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
              type="text"
              value={amount}
              onChange={handleAmountChange}
              placeholder="$0.00"
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