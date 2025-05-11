import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";

export default function AddExpensePage() {
  const categoriesData = useQuery(api.expenses.getCategories);
  const paymentTypesData = useQuery(api.expenses.getPaymentTypes);
  const lastTransactionData = useQuery(api.expenses.getLastTransaction);
  
  const categories = categoriesData ?? [];
  const paymentTypes = paymentTypesData ?? [];
  const lastTransaction = lastTransactionData;
  const addExpense = useMutation(api.expenses.addExpense);
  const hasInitialized = useRef(false);
  
  const [date, setDate] = useState(new Date());
  const [paymentType, setPaymentType] = useState("");
  const [cuotas, setCuotas] = useState("1");
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
    const arePaymentTypesLoading = typeof paymentTypesData === 'undefined';

    // Wait until all relevant data sources for prefilling have loaded
    if (isLastTransactionLoading || areCategoriesLoading || arePaymentTypesLoading) {
      return;
    }

    // All data sources are now loaded (they are not undefined anymore).
    // lastTransactionData can be null or an object.
    // categoriesData and paymentTypesData will be arrays (possibly empty if query returned empty, but not null).

    if (lastTransaction) { // lastTransactionData is an object (truthy)
      setCategory(lastTransaction.category);
      setPaymentType(lastTransaction.paymentType);
    } else { // lastTransactionData is null (falsy)
      // Use categoriesData and paymentTypesData directly as they are loaded arrays
      if (categoriesData && categoriesData.length > 0) {
        setCategory(categoriesData[0]);
      }
      if (paymentTypesData && paymentTypesData.length > 0) {
        setPaymentType(paymentTypesData[0]);
      }
    }
    hasInitialized.current = true; // All sources loaded, prefill decision made.

  }, [lastTransaction, categoriesData, paymentTypesData]); // Dependencies trigger effect when data changes
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
      
      <div className="flex gap-4">
        <div className="w-3/4">
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
        
        <div className="w-1/4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cuotas
          </label>
          <input
            type="number"
            min="1"
            value={cuotas}
            onChange={e => setCuotas(e.target.value)}
            className="w-full px-4 py-2 border rounded"
          />
        </div>
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
