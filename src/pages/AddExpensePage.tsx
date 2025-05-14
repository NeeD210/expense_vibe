import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function AddExpensePage() {
  const categoriesData = useQuery(api.expenses.getCategories);
  const paymentTypesData = useQuery(api.expenses.getPaymentTypes);
  const lastTransactionData = useQuery(api.expenses.getLastTransaction);
  
  const categories = categoriesData ?? [];
  const paymentTypes = paymentTypesData ?? [];
  const lastTransaction = lastTransactionData;
  const addExpense = useMutation(api.expenses.addExpense);
  const hasInitialized = useRef(false);
  const { toast } = useToast();
  
  const [date, setDate] = useState(new Date());
  const [paymentType, setPaymentType] = useState("");
  const [cuotas, setCuotas] = useState("1");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [amountError, setAmountError] = useState(false);

  // Set initial values only once when the component mounts and all data is loaded
  useEffect(() => {
    if (hasInitialized.current) {
      return;
    }

    const isLastTransactionLoading = typeof lastTransactionData === 'undefined';
    const areCategoriesLoading = typeof categoriesData === 'undefined';
    const arePaymentTypesLoading = typeof paymentTypesData === 'undefined';

    // Wait until all relevant data sources for prefilling have loaded
    if (isLastTransactionLoading || areCategoriesLoading || arePaymentTypesLoading) {
      return;
    }

    // All data sources are now loaded
    if (lastTransaction) {
      setCategory(lastTransaction.category);
      setPaymentType(lastTransaction.paymentType);
    } else {
      if (categoriesData && categoriesData.length > 0) {
        setCategory(categoriesData[0]);
      }
      if (paymentTypesData && paymentTypesData.length > 0) {
        setPaymentType(paymentTypesData[0]);
      }
    }
    hasInitialized.current = true;

  }, [lastTransaction, categoriesData, paymentTypesData]);
  
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
    const finalPaymentType = paymentType || paymentTypes[0] || "";
    
    try {
      await addExpense({
        date: date.getTime(),
        paymentType: finalPaymentType,
        category: finalCategory,
        description,
        amount: parseFloat(amount),
        cuotas: parseInt(cuotas),
        transactionType: "expense",
      });
      
      toast({
        title: "Success",
        description: "Expense added successfully",
      });
      setDescription("");
      setAmount("");
      setAmountError(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add expense",
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
        <CardTitle>Add Expense</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date.toISOString().split('T')[0]}
              onChange={e => setDate(new Date(e.target.value))}
            />
          </div>
          
          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-3 space-y-2">
              <Label htmlFor="paymentType">Payment Type</Label>
              <Select value={paymentType} onValueChange={setPaymentType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment type" />
                </SelectTrigger>
                <SelectContent>
                  {paymentTypes.map(pt => (
                    <SelectItem key={pt} value={pt}>
                      {pt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="cuotas">Cuotas</Label>
              <Input
                id="cuotas"
                type="number"
                min="1"
                value={cuotas}
                onChange={e => setCuotas(e.target.value)}
              />
            </div>
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
            Add Expense
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
