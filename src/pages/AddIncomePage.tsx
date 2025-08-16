import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CategorySelectWithCreate from "@/components/CategorySelectWithCreate";
import { 
  Drawer, 
  DrawerContent, 
  DrawerHeader, 
  DrawerTitle,
  DrawerFooter,
  DrawerClose 
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import { Id } from "../../convex/_generated/dataModel";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

interface AddIncomePageProps {
  onOpenChange: (open: boolean) => void;
}

export default function AddIncomePage({ onOpenChange }: AddIncomePageProps) {
  const categoriesData = useQuery(api.expenses.getCategoriesWithIds);
  const categories = categoriesData?.filter(c => c.transactionType === "income") ?? [];
  const addExpense = useMutation(api.expenses.addExpense);
  const { toast } = useToast();
  
  const [date, setDate] = useState<Date>(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [categoryId, setCategoryId] = useState<Id<"categories"> | "">("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [amountError, setAmountError] = useState(false);
  
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
      
      // Close the drawer after successful submission
      onOpenChange(false);
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
    <Drawer open={true} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-background">
        <div className="mx-auto w-full max-w-md flex flex-col overflow-y-auto max-h-[90vh] rounded-t-[10px]">
          <DrawerHeader className="p-4">
            <DrawerTitle>Add Income</DrawerTitle>
          </DrawerHeader>
          
          <div className="p-4">
            <form onSubmit={handleSubmit} id="add-income-form" className="flex flex-col gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen} modal={true}>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(date) => {
                        if (date) {
                          setDate(date);
                          setIsCalendarOpen(false);
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <CategorySelectWithCreate
                  value={categoryId}
                  onChange={(value) => setCategoryId(value as Id<"categories"> | "")}
                  transactionType="income"
                />
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
                  inputMode="numeric"
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
            </form>
          </div>
          
          <DrawerFooter className="p-4 mt-auto">
            <Button type="submit" form="add-income-form">Add Income</Button>
            <DrawerClose asChild>
              <Button variant="outline">Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
} 