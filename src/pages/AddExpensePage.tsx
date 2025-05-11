import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { toast } from "sonner";

export default function AddExpensePage() {
  const categories = useQuery(api.expenses.getCategories) ?? [];
  const paymentTypes = useQuery(api.expenses.getPaymentTypes) ?? [];
  const addExpense = useMutation(api.expenses.addExpense);
  
  const [date, setDate] = useState(new Date());
  const [paymentType, setPaymentType] = useState(paymentTypes[0] ?? "");
  const [category, setCategory] = useState(categories[0] ?? "");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await addExpense({
        date: date.getTime(),
        paymentType,
        category,
        description,
        amount: parseFloat(amount),
      });
      
      toast.success("Expense added");
      setDescription("");
      setAmount("");
    } catch (error) {
      toast.error("Failed to add expense");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Date
        </label>
        <input
          type="date"
          value={date.toISOString().split('T')[0]}
          onChange={e => setDate(new Date(e.target.value))}
          className="w-full px-4 py-2 border rounded"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Payment Type
        </label>
        <select
          value={paymentType}
          onChange={e => setPaymentType(e.target.value)}
          className="w-full px-4 py-2 border rounded"
        >
          {paymentTypes.map(pt => (
            <option key={pt} value={pt}>
              {pt}
            </option>
          ))}
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Category
        </label>
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="w-full px-4 py-2 border rounded"
        >
          {categories.map(c => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <input
          type="text"
          value={description}
          onChange={e => setDescription(e.target.value)}
          className="w-full px-4 py-2 border rounded"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Amount
        </label>
        <input
          type="number"
          step="0.01"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          className="w-full px-4 py-2 border rounded"
        />
      </div>
      
      <button
        type="submit"
        className="w-full px-4 py-2 bg-blue-500 text-white rounded mt-4"
      >
        Add Expense
      </button>
    </form>
  );
}
