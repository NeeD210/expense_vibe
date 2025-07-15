import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { format, parseISO } from 'date-fns';
import { PlusIcon, EditIcon, TrashIcon, PowerIcon } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import RecurringTransactionForm from './RecurringTransactionForm';
import { FixedSizeGrid as Grid } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

const formatFrequency = (frequency: string): string => {
  switch (frequency) {
    case 'daily': return 'Daily';
    case 'weekly': return 'Weekly';
    case 'monthly': return 'Monthly';
    case 'yearly': return 'Yearly';
    default: return frequency;
  }
};

// Memoized transaction card component
const TransactionCard = React.memo(({ 
  transaction, 
  onEdit, 
  onDelete, 
  onToggleStatus,
  categoryName,
  paymentTypeName 
}: { 
  transaction: any;
  onEdit: (id: Id<'recurringTransactions'>) => void;
  onDelete: (id: Id<'recurringTransactions'>) => void;
  onToggleStatus: (id: Id<'recurringTransactions'>) => void;
  categoryName: string;
  paymentTypeName: string;
}) => (
  <Card className={transaction.isActive ? "" : "opacity-60"}>
    <CardHeader className="pb-2">
      <div className="flex justify-between items-start">
        <div>
          <CardTitle className="text-base font-medium">
            {transaction.description}
          </CardTitle>
          <div className="text-sm text-muted-foreground mt-1">
            {categoryName} • {paymentTypeName}
          </div>
        </div>
        <div className="flex flex-col items-end">
          <div className={`font-medium ${transaction.transactionType === 'expense' ? 'text-red-500' : 'text-green-500'}`}>
            {transaction.transactionType === 'expense' ? '-' : '+'} ${transaction.amount.toFixed(2)}
          </div>
          <Badge variant={transaction.isActive ? "default" : "outline"} className="mt-1">
            {transaction.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </div>
    </CardHeader>
    
    <CardContent>
      <div className="text-sm">
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          <div className="text-muted-foreground">Frequency:</div>
          <div>{formatFrequency(transaction.frequency)}</div>
          
          <div className="text-muted-foreground">Starts:</div>
          <div>{format(transaction.startDate, 'MMM d, yyyy')}</div>
          
          {transaction.endDate && (
            <>
              <div className="text-muted-foreground">Ends:</div>
              <div>{format(transaction.endDate, 'MMM d, yyyy')}</div>
            </>
          )}
          
          {transaction.nextDueDateCalculationDay && (
            <>
              <div className="text-muted-foreground">Day of month:</div>
              <div>{transaction.nextDueDateCalculationDay}</div>
            </>
          )}
        </div>
      </div>
      
      <Separator className="my-3" />
      
      <div className="flex justify-end gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onToggleStatus(transaction._id)}
          title={transaction.isActive ? 'Deactivate' : 'Activate'}
        >
          <PowerIcon className={`h-4 w-4 ${transaction.isActive ? 'text-green-500' : 'text-gray-400'}`} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(transaction._id)}
          title="Edit"
        >
          <EditIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(transaction._id)}
          className="text-red-500 hover:text-red-700"
          title="Delete"
        >
          <TrashIcon className="h-4 w-4" />
        </Button>
      </div>
    </CardContent>
  </Card>
));

TransactionCard.displayName = 'TransactionCard';

const RecurringTransactionList: React.FC = () => {
  const recurringTransactions = useQuery(api.recurring.listRecurringTransactions) || [];
  const categories = useQuery(api.expenses.getCategoriesWithIds) || [];
  const paymentTypes = useQuery(api.expenses.getPaymentTypes) || [];
  
  const deleteRecurringTransaction = useMutation(api.recurring.deleteRecurringTransaction);
  const toggleRecurringTransactionStatus = useMutation(api.recurring.toggleRecurringTransactionStatus);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editId, setEditId] = useState<Id<'recurringTransactions'> | undefined>(undefined);
  const [deleteId, setDeleteId] = useState<Id<'recurringTransactions'> | undefined>(undefined);

  // Memoize category and payment type maps for faster lookups
  const categoryMap = useMemo(() => {
    return new Map(categories.map(cat => [cat._id, cat.name]));
  }, [categories]);

  const paymentTypeMap = useMemo(() => {
    return new Map(paymentTypes.map(pt => [pt._id, pt.name]));
  }, [paymentTypes]);
  
  const handleEdit = useCallback((id: Id<'recurringTransactions'>) => {
    setEditId(id);
    setIsFormOpen(true);
  }, []);
  
  const handleDelete = useCallback(async () => {
    if (deleteId) {
      await deleteRecurringTransaction({ id: deleteId });
      setDeleteId(undefined);
    }
  }, [deleteId, deleteRecurringTransaction]);
  
  const handleToggleStatus = useCallback(async (id: Id<'recurringTransactions'>) => {
    await toggleRecurringTransactionStatus({ id });
  }, [toggleRecurringTransactionStatus]);
  
  const handleAddNew = useCallback(() => {
    setEditId(undefined);
    setIsFormOpen(true);
  }, []);
  
  const handleCloseForm = useCallback(() => {
    setIsFormOpen(false);
    setEditId(undefined);
  }, []);

  // Memoize the getCategoryName and getPaymentTypeName functions
  const getCategoryName = useCallback((categoryId: Id<'categories'>) => {
    return categoryMap.get(categoryId) || 'Unknown';
  }, [categoryMap]);

  const getPaymentTypeName = useCallback((paymentTypeId: Id<'paymentTypes'> | undefined) => {
    return paymentTypeId ? (paymentTypeMap.get(paymentTypeId) || 'Unknown') : 'Unknown';
  }, [paymentTypeMap]);

  // Memoize the cell renderer for the virtualized grid
  const Cell = useCallback(({ columnIndex, rowIndex, style }: { 
    columnIndex: number; 
    rowIndex: number; 
    style: React.CSSProperties;
  }) => {
    const index = rowIndex * 2 + columnIndex;
    if (index >= recurringTransactions.length) return null;

    const transaction = recurringTransactions[index];
    return (
      <div style={style} className="p-2">
        <TransactionCard
          transaction={transaction}
          onEdit={handleEdit}
          onDelete={setDeleteId}
          onToggleStatus={handleToggleStatus}
          categoryName={getCategoryName(transaction.categoryId)}
          paymentTypeName={getPaymentTypeName(transaction.paymentTypeId)}
        />
      </div>
    );
  }, [recurringTransactions, handleEdit, handleToggleStatus, getCategoryName, getPaymentTypeName]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Recurring Transactions</h2>
        <Button onClick={handleAddNew} size="sm">
          <PlusIcon className="mr-2 h-4 w-4" />
          Add New
        </Button>
      </div>
      
      {recurringTransactions.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            No recurring transactions yet. Add one to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="h-[600px]">
          <AutoSizer>
            {({ height, width }: { height: number; width: number }) => {
              const columnCount = Math.min(2, Math.floor(width / 400));
              const rowCount = Math.ceil(recurringTransactions.length / columnCount);
              const columnWidth = width / columnCount;
              const rowHeight = 300; // Adjust based on your card height

              return (
                <Grid
                  columnCount={columnCount}
                  columnWidth={columnWidth}
                  height={height}
                  rowCount={rowCount}
                  rowHeight={rowHeight}
                  width={width}
                >
                  {Cell}
                </Grid>
              );
            }}
          </AutoSizer>
        </div>
      )}
      
      {isFormOpen && (
        <RecurringTransactionForm
          onOpenChange={handleCloseForm}
          editId={editId}
        />
      )}
      
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(undefined)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this recurring transaction? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(undefined)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RecurringTransactionList; 