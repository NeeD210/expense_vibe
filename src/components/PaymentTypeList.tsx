import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { PaymentTypeForm } from "./PaymentTypeForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface PaymentType {
  _id: Id<"paymentTypes">;
  name: string;
  isCredit?: boolean;
  closingDay?: number;
  dueDay?: number;
}

export function PaymentTypeList() {
  const [isAdding, setIsAdding] = useState(false);
  const [editingType, setEditingType] = useState<{
    id: Id<"paymentTypes">;
    name: string;
    isCredit: boolean;
    closingDay?: number;
    dueDay?: number;
  } | null>(null);

  const paymentTypes = useQuery(api.expenses.getPaymentTypes) ?? [];
  const removePaymentType = useMutation(api.expenses.removePaymentType);

  const handleDelete = async (id: Id<"paymentTypes">) => {
    if (window.confirm("Are you sure you want to delete this payment type?")) {
      try {
        await removePaymentType({ id });
        setEditingType(null);
      } catch (error) {
        console.error("Error deleting payment type:", error);
        alert("Error deleting payment type. Please try again.");
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Payment Types</h2>
        <Button
          onClick={() => setIsAdding(true)}
          className="inline-flex items-center px-4 py-2"
        >
          Add Payment Type
        </Button>
      </div>

      {isAdding && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-lg font-medium text-foreground mb-4">Add Payment Type</h3>
            <PaymentTypeForm
              onSuccess={() => setIsAdding(false)}
              onCancel={() => setIsAdding(false)}
            />
          </CardContent>
        </Card>
      )}

      {editingType && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-lg font-medium text-foreground mb-4">Edit Payment Type</h3>
            <PaymentTypeForm
              initialData={editingType}
              onSuccess={() => setEditingType(null)}
              onCancel={() => setEditingType(null)}
              renderActions={({ handleSubmit }) => (
                <div className="mt-4 flex justify-between w-full">
                  <Button
                    variant="destructive"
                    type="button"
                    onClick={() => handleDelete(editingType.id)}
                  >
                    Delete
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      type="button"
                      onClick={() => setEditingType(null)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                    >
                      Update
                    </Button>
                  </div>
                </div>
              )}
            />
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {paymentTypes.map((type) => (
          <Card key={type._id}>
            <CardContent className="p-4">
              <div 
                className="flex-1 cursor-pointer hover:bg-accent/50 p-2 rounded-md transition-colors"
                onClick={() => setEditingType({
                  id: type._id,
                  name: type.name,
                  isCredit: type.isCredit ?? false,
                  closingDay: type.closingDay,
                  dueDay: type.dueDay,
                })}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="font-medium text-foreground">{type.name}</div>
                      {type.isCredit ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Credit
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Debit
                        </span>
                      )}
                    </div>
                    {type.isCredit && type.closingDay && type.dueDay && (
                      <div className="text-sm text-muted-foreground">
                        Closing: {type.closingDay} | Due: {type.dueDay}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 