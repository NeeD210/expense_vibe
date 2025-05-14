import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";

export default function AddIncomePage() {
  const categoriesData = useQuery(api.expenses.getCategories);
  const lastTransactionData = useQuery(api.expenses.getLastTransaction);
  
  const categories = categoriesData ?? [];
  const lastTransaction = lastTransactionData;
  const addExpense = useMutation(api.expenses.addExpense);
  const hasInitialized = useRef(false);
  
  const [date, setDate] = useState(new Date());
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");

  // Set initial values only once when the component mounts and all data is loaded
  useEffect(() => {
    if (hasInitialized.current) {
      return;
    }

    const isLastTransactionLoading = typeof lastTransactionData === 'undefined';
    const areCategoriesLoading = typeof categoriesData === 'undefined';

    // Wait until all relevant data sources for prefilling have loaded
    if (isLastTransactionLoading || areCategoriesLoading) {
      return;
    }

    // All data sources are now loaded
    if (lastTransaction) {
      setCategory(lastTransaction.category);
    } else {
      if (categoriesData && categoriesData.length > 0) {
        setCategory(categoriesData[0]);
      }
    }
    hasInitialized.current = true;

  }, [lastTransaction, categoriesData]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate amount
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    
    // Ensure we have valid values before submitting
    const finalCategory = category || categories[0] || "";
    
    try {
      await addExpense({
        date: date.getTime(),
        paymentType: "Cash", // Autofilled
        category: finalCategory,
        description,
        amount: parseFloat(amount),
        cuotas: 1, // Autofilled
        transactionType: "income", // Autofilled
      });
      
      toast.success("Income added");
      setDescription("");
      setAmount("");
    } catch (error) {
      toast.error("Failed to add income");
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
          onChange={e => {
            const newDate = new Date(e.target.value);
            newDate.setUTCHours(12, 0, 0, 0);
            setDate(newDate);
          }}
          className="w-full px-4 py-2 border rounded"
        />
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
          required
          min="0.01"
        />
      </div>
      
      <button
        type="submit"
        className="w-full px-4 py-2 bg-green-500 text-white rounded mt-4"
      >
        Add Income
      </button>
    </form>
  );
} 