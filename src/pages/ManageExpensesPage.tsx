import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ArrowLeft, Edit2, Trash2 } from "lucide-react";
import { Id } from "../../convex/_generated/dataModel";

type EditingExpense = {
  id: Id<"expenses">;
  date: Date;
  paymentType: string;
  category: string;
  description: string;
  amount: number;
};

export default function ManageExpensesPage() {
  const expenses = useQuery(api.expenses.listExpenses) ?? [];
  const categories = useQuery(api.expenses.getCategories) ?? [];
  const paymentTypes = useQuery(api.expenses.getPaymentTypes) ?? [];
  const deleteExpense = useMutation(api.expenses.deleteExpense);
  const updateExpense = useMutation(api.expenses.updateExpense);
  
  const [editingExpense, setEditingExpense] = useState<EditingExpense | null>(null);
  
  const handleDelete = async (id: Id<"expenses">) => {
    try {
      await deleteExpense({ id });
      toast.success("Expense deleted");
    } catch (error) {
      toast.error("Failed to delete expense");
    }
  };
  
  const handleEdit = (expense: any) => {
    setEditingExpense({
      id: expense._id,
      date: new Date(expense.date),
      paymentType: expense.paymentType,
      category: expense.category,
      description: expense.description,
      amount: expense.amount,
    });
  };
  
  const handleSaveEdit = async () => {
    if (!editingExpense) return;
    
    try {
      await updateExpense({
        id: editingExpense.id,
        date: editingExpense.date.getTime(),
        paymentType: editingExpense.paymentType,
        category: editingExpense.category,
        description: editingExpense.description,
        amount: editingExpense.amount,
      });
      
      setEditingExpense(null);
      toast.success("Expense updated");
    } catch (error) {
      toast.error("Failed to update expense");
    }
  };
  
  const handleCancelEdit = () => {
    setEditingExpense(null);
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
        <h2 className="text-2xl font-semibold">Manage Expenses</h2>
      </div>
      
      <div className="flex flex-col gap-2">
        {expenses.map(expense => (
          <div
            key={expense._id}
            className="flex items-center justify-between p-4 bg-white rounded-lg shadow"
          >
            {editingExpense?.id === expense._id ? (
              <div className="flex-1 flex flex-col gap-2">
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={editingExpense.date.toISOString().split('T')[0]}
                    onChange={e => setEditingExpense({
                      ...editingExpense,
                      date: new Date(e.target.value),
                    })}
                    className="px-4 py-2 border rounded"
                  />
                  <select
                    value={editingExpense.paymentType}
                    onChange={e => setEditingExpense({
                      ...editingExpense,
                      paymentType: e.target.value,
                    })}
                    className="px-4 py-2 border rounded"
                  >
                    {paymentTypes.map(pt => (
                      <option key={pt} value={pt}>{pt}</option>
                    ))}
                  </select>
                  <select
                    value={editingExpense.category}
                    onChange={e => setEditingExpense({
                      ...editingExpense,
                      category: e.target.value,
                    })}
                    className="px-4 py-2 border rounded"
                  >
                    {categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editingExpense.description}
                    onChange={e => setEditingExpense({
                      ...editingExpense,
                      description: e.target.value,
                    })}
                    placeholder="Description"
                    className="flex-1 px-4 py-2 border rounded"
                  />
                  <input
                    type="number"
                    step="0.01"
                    value={editingExpense.amount}
                    onChange={e => setEditingExpense({
                      ...editingExpense,
                      amount: parseFloat(e.target.value),
                    })}
                    className="w-32 px-4 py-2 border rounded"
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
                  <div className="font-medium">{expense.category}</div>
                  <div className="text-sm text-gray-500">{expense.description}</div>
                  <div className="text-xs text-gray-400">
                    {format(expense.date, 'MMM d, yyyy')} • {expense.paymentType}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="font-medium">
                    ${expense.amount.toFixed(2)}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(expense)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(expense._id)}
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