import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

type ConfigView = "navigation" | "categories" | "paymentTypes";

export default function ConfigPage() {
  const [currentView, setCurrentView] = useState<ConfigView>("navigation");
  const categories = useQuery(api.expenses.getCategories) ?? [];
  const paymentTypes = useQuery(api.expenses.getPaymentTypes) ?? [];
  const updateCategories = useMutation(api.expenses.updateCategories);
  const updatePaymentTypes = useMutation(api.expenses.updatePaymentTypes);
  const [newCategory, setNewCategory] = useState("");
  const [newPaymentType, setNewPaymentType] = useState("");

  const handleAddCategory = () => {
    if (!newCategory.trim()) return;
    updateCategories({ categories: [...categories, newCategory.trim()] });
    setNewCategory("");
    toast.success("Category added");
  };
  
  const handleRemoveCategory = (category: string) => {
    updateCategories({ categories: categories.filter(c => c !== category) });
    toast.success("Category removed");
  };

  const handleAddPaymentType = () => {
    if (!newPaymentType.trim()) return;
    updatePaymentTypes({ paymentTypes: [...paymentTypes, newPaymentType.trim()] });
    setNewPaymentType("");
    toast.success("Payment type added");
  };
  
  const handleRemovePaymentType = (paymentType: string) => {
    updatePaymentTypes({ paymentTypes: paymentTypes.filter(p => p !== paymentType) });
    toast.success("Payment type removed");
  };

  if (currentView === "navigation") {
    return (
      <div className="flex flex-col gap-6">
        <h2 className="text-2xl font-semibold">Settings</h2>
        
        <div className="grid gap-4">
          <button
            onClick={() => setCurrentView("categories")}
            className="p-4 bg-white rounded-lg shadow text-left hover:bg-gray-50 transition-colors"
          >
            <h3 className="font-medium">Modify Categories</h3>
            <p className="text-sm text-gray-500">Add, remove, or edit expense categories</p>
          </button>
          
          <button
            onClick={() => setCurrentView("paymentTypes")}
            className="p-4 bg-white rounded-lg shadow text-left hover:bg-gray-50 transition-colors"
          >
            <h3 className="font-medium">Modify Payment Types</h3>
            <p className="text-sm text-gray-500">Add, remove, or edit payment methods</p>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setCurrentView("navigation")}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-2xl font-semibold">
          {currentView === "categories" ? "Categories" : "Payment Types"}
        </h2>
      </div>
      
      {currentView === "categories" ? (
        <>
          <div className="flex gap-2">
            <input
              type="text"
              value={newCategory}
              onChange={e => setNewCategory(e.target.value)}
              placeholder="New category"
              className="flex-1 px-4 py-2 border rounded"
            />
            <button
              onClick={handleAddCategory}
              className="px-4 py-2 bg-blue-500 text-white rounded"
            >
              Add
            </button>
          </div>
          
          <div className="flex flex-col gap-2">
            {categories.map(category => (
              <div
                key={category}
                className="flex items-center justify-between p-4 bg-white rounded-lg shadow"
              >
                <span>{category}</span>
                <button
                  onClick={() => handleRemoveCategory(category)}
                  className="text-red-500"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="flex gap-2">
            <input
              type="text"
              value={newPaymentType}
              onChange={e => setNewPaymentType(e.target.value)}
              placeholder="New payment type"
              className="flex-1 px-4 py-2 border rounded"
            />
            <button
              onClick={handleAddPaymentType}
              className="px-4 py-2 bg-blue-500 text-white rounded"
            >
              Add
            </button>
          </div>
          
          <div className="flex flex-col gap-2">
            {paymentTypes.map(paymentType => (
              <div
                key={paymentType}
                className="flex items-center justify-between p-4 bg-white rounded-lg shadow"
              >
                <span>{paymentType}</span>
                <button
                  onClick={() => handleRemovePaymentType(paymentType)}
                  className="text-red-500"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
