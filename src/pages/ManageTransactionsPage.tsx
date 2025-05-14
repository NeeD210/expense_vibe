import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ArrowLeft, Edit2, Trash2 } from "lucide-react";
import { Id } from "../../convex/_generated/dataModel";

type EditingTransaction = {
  id: Id<"expenses">;
  date: Date;
  paymentType: string;
  category: string;
  description: string;
  amount: number;
  cuotas: number;
  transactionType: string;
};

export default function ManageTransactionsPage() {
  const transactions = useQuery(api.expenses.listAllTransactions) ?? [];
  const categories = useQuery(api.expenses.getCategories) ?? [];
  const paymentTypes = useQuery(api.expenses.getPaymentTypes) ?? [];
  const deleteExpense = useMutation(api.expenses.deleteExpense);
  const updateExpense = useMutation(api.expenses.updateExpense);
  
  const [editingTransaction, setEditingTransaction] = useState<EditingTransaction | null>(null);
  
  const handleDelete = async (id: Id<"expenses">) => {
    try {
      await deleteExpense({ id });
      toast.success("Transaction deleted");
    } catch (error) {
      toast.error("Failed to delete transaction");
    }
  };
  
  const handleEdit = (transaction: any) => {
    setEditingTransaction({
      id: transaction._id,
      date: new Date(transaction.date),
      paymentType: transaction.paymentType,
      category: transaction.category,
      description: transaction.description,
      amount: transaction.amount,
      cuotas: transaction.cuotas ?? 1,
      transactionType: transaction.transactionType,
    });
  };
  
  const handleSaveEdit = async () => {
    if (!editingTransaction) return;
    
    try {
      await updateExpense({
        id: editingTransaction.id,
        date: editingTransaction.date.getTime(),
        paymentType: editingTransaction.paymentType,
        category: editingTransaction.category,
        description: editingTransaction.description,
        amount: editingTransaction.amount,
        cuotas: editingTransaction.cuotas,
      });
      
      setEditingTransaction(null);
      toast.success("Transaction updated");
    } catch (error) {
      toast.error("Failed to update transaction");
    }
  };
  
  const handleCancelEdit = () => {
    setEditingTransaction(null);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => window.history.back()}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-2xl font-semibold">Manage Transactions</h2>
      </div>
      
      <div className="flex flex-col gap-2">
        {transactions.map(transaction => (
          <div
            key={transaction._id}
            className="flex items-center justify-between p-4 bg-white rounded-lg shadow"
          >
            {editingTransaction?.id === transaction._id ? (
              <div className="flex-1 flex flex-col gap-4">
                <input
                  type="date"
                  value={editingTransaction.date.toISOString().split('T')[0]}
                  onChange={e => setEditingTransaction({
                    ...editingTransaction,
                    date: new Date(e.target.value),
                  })}
                  className="w-full px-4 py-2 border rounded"
                />
                <select
                  value={editingTransaction.paymentType}
                  onChange={e => setEditingTransaction({
                    ...editingTransaction,
                    paymentType: e.target.value,
                  })}
                  className="w-full px-4 py-2 border rounded"
                >
                  {paymentTypes.map(pt => (
                    <option key={pt} value={pt}>{pt}</option>
                  ))}
                </select>
                <select
                  value={editingTransaction.category}
                  onChange={e => setEditingTransaction({
                    ...editingTransaction,
                    category: e.target.value,
                  })}
                  className="w-full px-4 py-2 border rounded"
                >
                  {categories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={editingTransaction.description}
                  onChange={e => setEditingTransaction({
                    ...editingTransaction,
                    description: e.target.value,
                  })}
                  placeholder="Description"
                  className="w-full px-4 py-2 border rounded"
                />
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.01"
                    value={editingTransaction.amount}
                    onChange={e => setEditingTransaction({
                      ...editingTransaction,
                      amount: parseFloat(e.target.value),
                    })}
                    className="flex-1 px-4 py-2 border rounded"
                  />
                  <input
                    type="number"
                    min="1"
                    value={editingTransaction.cuotas}
                    onChange={e => setEditingTransaction({
                      ...editingTransaction,
                      cuotas: parseInt(e.target.value),
                    })}
                    className="w-24 px-4 py-2 border rounded"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={handleCancelEdit}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="px-4 py-2 bg-blue-500 text-white rounded"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div>
                  <div className="font-medium">{transaction.category}</div>
                  <div className="text-sm text-gray-500">{transaction.description}</div>
                  <div className="text-xs text-gray-400">
                    {format(transaction.date, 'MMM d, yyyy')}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="font-medium text-right">
                    <span className={transaction.transactionType === 'income' ? 'text-green-600' : ''}>
                      {transaction.transactionType === 'income' ? '+' : ''}${transaction.amount.toFixed(2)}
                    </span>
                    <div className="text-sm text-gray-500 font-normal">
                      {transaction.transactionType === 'expense' && transaction.paymentType}
                      {transaction.cuotas && transaction.cuotas > 1 && ` - ${transaction.cuotas} cuota${transaction.cuotas > 1 ? 's' : ''}`}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(transaction)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(transaction._id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 