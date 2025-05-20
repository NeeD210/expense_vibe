import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface PaymentTypeFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialData?: {
    id: Id<"paymentTypes">;
    name: string;
    isCredit: boolean;
    closingDay?: number;
    dueDay?: number;
  };
  renderActions?: (props: { handleSubmit: (e: React.FormEvent) => void }) => React.ReactNode;
}

export function PaymentTypeForm({ onSuccess, onCancel, initialData, renderActions }: PaymentTypeFormProps) {
  const [name, setName] = useState(initialData?.name ?? "");
  const [isCredit, setIsCredit] = useState(initialData?.isCredit ?? false);
  const [closingDay, setClosingDay] = useState(initialData?.closingDay?.toString() ?? "");
  const [dueDay, setDueDay] = useState(initialData?.dueDay?.toString() ?? "");

  const addPaymentType = useMutation(api.expenses.addPaymentType);
  const updatePaymentTypes = useMutation(api.expenses.updatePaymentTypes);
  const existingPaymentTypes = useQuery(api.expenses.getPaymentTypes) ?? [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (initialData) {
        // Update existing payment type
        const updatedPaymentTypes = existingPaymentTypes.map(type => {
          if (type._id === initialData.id) {
            return {
              name,
              isCredit,
              closingDay: isCredit ? parseInt(closingDay) : undefined,
              dueDay: isCredit ? parseInt(dueDay) : undefined,
            };
          }
          return {
            name: type.name,
            isCredit: type.isCredit ?? false,
            closingDay: type.closingDay,
            dueDay: type.dueDay,
          };
        });

        await updatePaymentTypes({
          paymentTypes: updatedPaymentTypes,
        });
      } else {
        // Create new payment type
        await addPaymentType({
          name,
          isCredit,
          closingDay: isCredit ? parseInt(closingDay) : undefined,
          dueDay: isCredit ? parseInt(dueDay) : undefined,
        });
      }
      onSuccess?.();
    } catch (error) {
      console.error("Error saving payment type:", error);
      alert("Error saving payment type. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter payment type name"
          required
          className="h-10"
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="isCredit"
          checked={isCredit}
          onCheckedChange={(checked: boolean | "indeterminate") => setIsCredit(checked === true)}
        />
        <Label htmlFor="isCredit" className="text-sm font-normal">
          This is a credit card
        </Label>
      </div>

      {isCredit && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="closingDay">Closing Day (1-31)</Label>
            <Input
              id="closingDay"
              type="number"
              value={closingDay}
              onChange={(e) => setClosingDay(e.target.value)}
              min="1"
              max="31"
              required
              className="h-10"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDay">Due Day (1-31)</Label>
            <Input
              id="dueDay"
              type="number"
              value={dueDay}
              onChange={(e) => setDueDay(e.target.value)}
              min="1"
              max="31"
              required
              className="h-10"
            />
          </div>
        </div>
      )}

      {renderActions ? (
        renderActions({ handleSubmit })
      ) : (
        <div className="flex justify-end space-x-3">
          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
          >
            {initialData ? "Update" : "Create"}
          </Button>
        </div>
      )}
    </form>
  );
} 