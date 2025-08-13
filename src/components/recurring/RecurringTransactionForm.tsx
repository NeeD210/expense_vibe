import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { Button } from '../ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose,
} from '../ui/drawer';
import { Input } from '../ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { Label } from '../ui/label';
import { cn } from '../../lib/utils';
import { useToast } from '@/hooks/use-toast';

interface PaymentType {
  _id: Id<"paymentTypes">;
  name: string;
}

interface Category {
  _id: Id<"categories">;
  name: string;
}

interface RecurringTransactionFormProps {
  onOpenChange: (open: boolean) => void;
  editId?: Id<'recurringTransactions'>;
}

const RecurringTransactionForm = ({ onOpenChange, editId }: RecurringTransactionFormProps) => {
  const { toast } = useToast();
  const categoriesQuery = useQuery(api.expenses.getCategoriesWithIds);
  const categories = categoriesQuery || [];
  const paymentTypes = useQuery(api.expenses.getPaymentTypes) || [];
  const recurringTransaction = editId 
    ? useQuery(api.recurring.listRecurringTransactions)?.find(t => t._id === editId)
    : undefined;
  
  const addRecurringTransaction = useMutation(api.recurring.addRecurringTransaction);
  const updateRecurringTransaction = useMutation(api.recurring.updateRecurringTransaction);

  // Form state
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [paymentTypeId, setPaymentTypeId] = useState('');
  const [transactionType, setTransactionType] = useState<'expense' | 'income'>('expense');
  const [frequency, setFrequency] = useState('monthly');
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [isStartCalendarOpen, setIsStartCalendarOpen] = useState(false);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [isEndCalendarOpen, setIsEndCalendarOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  // Load data if editing
  useEffect(() => {
    if (recurringTransaction && categories.length > 0) {
      setDescription(recurringTransaction.description);
      setAmount(formatAmount(recurringTransaction.amount));
      setCategoryId(recurringTransaction.categoryId);
      const foundPaymentType = paymentTypes.find(pt => pt._id === recurringTransaction.paymentTypeId);
      setPaymentTypeId(foundPaymentType ? String(recurringTransaction.paymentTypeId) : '');
      setTransactionType(recurringTransaction.transactionType as 'expense' | 'income');
      setFrequency(recurringTransaction.frequency as string);
      setStartDate(new Date(recurringTransaction.startDate));
      setEndDate(recurringTransaction.endDate ? new Date(recurringTransaction.endDate) : undefined);
    } else if (!recurringTransaction && !editId) {
      setDescription('');
      setAmount('');
      setCategoryId('');
      setPaymentTypeId('');
      setTransactionType('expense');
      setFrequency('monthly');
      setStartDate(new Date());
      setEndDate(undefined);
    }
  }, [recurringTransaction, categories, paymentTypes, editId]);

  useEffect(() => {
    if (categoriesQuery !== undefined) {
      setIsLoadingCategories(false);
    }
  }, [categoriesQuery]);

  const filteredCategories = categories.filter(cat => {
    return (
      !cat.transactionType ||
      cat.transactionType === transactionType ||
      cat._id === categoryId // Always include the selected category
    );
  });

  const formatAmount = (value: number | string): string => {
    if (typeof value === 'number') {
      return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    
    // Remove any non-digit characters except decimal point
    const numericValue = value.toString().replace(/[^\d.]/g, '');
    
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

  const parseAmount = (formattedValue: string): number => {
    return parseFloat(formattedValue.replace(/[$,]/g, '')) || 0;
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(formatAmount(e.target.value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setValidationError('');

    try {
      // Validate form
      if (!description) {
        setValidationError('Description is required');
        setIsSubmitting(false);
        return;
      }

      const amountValue = parseAmount(amount);
      if (amountValue <= 0) {
        setValidationError('Amount must be greater than zero');
        setIsSubmitting(false);
        return;
      }

      if (!categoryId) {
        setValidationError('Category is required');
        setIsSubmitting(false);
        return;
      }

      if (transactionType === 'expense' && !paymentTypeId) {
        setValidationError('Payment method is required for expenses');
        setIsSubmitting(false);
        return;
      }

      const formData = {
        description,
        amount: amountValue,
        categoryId: categoryId as Id<'categories'>,
        paymentTypeId: transactionType === 'expense' ? paymentTypeId as Id<'paymentTypes'> : undefined,
        transactionType,
        frequency,
        startDate: startDate.getTime(),
        endDate: endDate?.getTime(),
        cuotas: 1,
        // nextDueDateCalculationDay deprecated; backend computes nextDueDate
      };

      console.log('RecurringTransactionForm formData:', formData); // Debug log

      if (editId) {
        await updateRecurringTransaction({
          id: editId,
          ...formData,
        });
        toast({
          title: "Success",
          description: "Recurring transaction updated successfully",
        });
      } else {
        await addRecurringTransaction(formData);
        toast({
          title: "Success",
          description: "Recurring transaction added successfully",
        });
      }
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving recurring transaction:', error);
      toast({
        title: "Error",
        description: "Failed to save recurring transaction",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add loading state before rendering the form
  if (editId && (!recurringTransaction || !categoryId)) {
    return <div className="p-4 text-center">Loading...</div>;
  }

  return (
    <Drawer open={true} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-background">
        <div className="mx-auto w-full max-w-md flex flex-col overflow-y-auto max-h-[90vh] rounded-t-[10px]">
          <DrawerHeader className="p-4">
            <DrawerTitle>{editId ? 'Edit' : 'Add'} Recurring Transaction</DrawerTitle>
          </DrawerHeader>

          <div className="p-4 flex-grow">
            <form onSubmit={handleSubmit} id="recurring-transaction-form" className="flex flex-col gap-4 h-full">
              {validationError && (
                <div className="bg-destructive/10 p-3 rounded-md text-destructive text-sm">
                  {validationError}
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Popover open={isStartCalendarOpen} onOpenChange={setIsStartCalendarOpen} modal={true}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start" sideOffset={4}>
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={(date) => {
                          if (date) {
                            setStartDate(date);
                            setIsStartCalendarOpen(false);
                            if (endDate && endDate < date) {
                              setEndDate(undefined);
                            }
                          }
                        }}
                        initialFocus
                        className="rounded-md border"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="space-y-2">
                  <Label>End Date (Optional)</Label>
                  <Popover open={isEndCalendarOpen} onOpenChange={setIsEndCalendarOpen} modal={true}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !endDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "PPP") : <span>No end date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start" sideOffset={4}>
                      <div className="p-2">
                        <Button 
                          variant="ghost" 
                          className="w-full justify-start mb-2"
                          onClick={() => {
                            setEndDate(undefined);
                            setIsEndCalendarOpen(false);
                          }}
                        >
                          No end date
                        </Button>
                      </div>
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={(date) => {
                          setEndDate(date);
                          setIsEndCalendarOpen(false);
                        }}
                        disabled={(date) => date < startDate}
                        initialFocus
                        className="rounded-md border"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Transaction Type</Label>
                  <Select value={transactionType} onValueChange={(value) => {
                    setTransactionType(value as 'expense' | 'income');
                    setCategoryId(''); // Reset category when changing type
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="expense">Expense</SelectItem>
                      <SelectItem value="income">Income</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="frequency">Frequency</Label>
                  <Select value={frequency} onValueChange={setFrequency}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="semestrally">Semestrally</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {transactionType === 'expense' && (
                  <div className="space-y-2">
                    <Label htmlFor="paymentType">Payment Method</Label>
                    <Select value={paymentTypeId} onValueChange={(value) => setPaymentTypeId(value as Id<'paymentTypes'> | '')}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentTypes
                          .sort((a, b) => a.name.localeCompare(b.name))
                          .map(pt => (
                            <SelectItem key={pt._id} value={pt._id}>
                              <div className="flex items-center gap-2">
                                <span>{pt.name}</span>
                                {pt.isCredit ? (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    Credit
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    Debit
                                  </span>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={categoryId ? String(categoryId) : ''}
                    onValueChange={value => setCategoryId(String(value))}
                    disabled={isLoadingCategories || filteredCategories.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={isLoadingCategories ? "Loading categories..." : "Select category"} />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingCategories ? (
                        <SelectItem value="loading" disabled>Loading...</SelectItem>
                      ) : filteredCategories.length === 0 ? (
                        <SelectItem value="no-categories" disabled>No categories found. Please ensure you are logged in and have categories configured.</SelectItem>
                      ) : (
                        filteredCategories
                          .sort((a, b) => a.name.localeCompare(b.name))
                          .map(cat => (
                            <SelectItem key={String(cat._id)} value={String(cat._id)}>
                              {cat.name}
                            </SelectItem>
                          ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter description"
                />
              </div>
              <div className="space-y-2">
                <Label>Amount</Label>
                <Input
                  type="text"
                  value={amount}
                  onChange={handleAmountChange}
                  placeholder="$0.00"
                  inputMode="numeric"
                />
              </div>
            </form>
          </div>

          <DrawerFooter className="p-4 mt-auto">
            <Button type="submit" form="recurring-transaction-form" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : (editId ? 'Save Changes' : 'Add Transaction')}
            </Button>
            <DrawerClose asChild>
              <Button variant="outline">Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default RecurringTransactionForm; 