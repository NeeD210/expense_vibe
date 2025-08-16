import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface PaymentTypeRecord {
	_id: Id<"paymentTypes">;
	name: string;
	isCredit?: boolean;
}

interface PaymentTypeSelectWithCreateProps {
	value: Id<"paymentTypes"> | "" | string;
	onChange: (value: Id<"paymentTypes"> | "") => void;
	disabled?: boolean;
}

export default function PaymentTypeSelectWithCreate({ value, onChange, disabled }: PaymentTypeSelectWithCreateProps) {
	const { toast } = useToast();
	const paymentTypes = (useQuery(api.expenses.getPaymentTypes) as PaymentTypeRecord[] | undefined) ?? [];
	const addPaymentType = useMutation(api.expenses.addPaymentType);

	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [newName, setNewName] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [pendingNewId, setPendingNewId] = useState<Id<"paymentTypes"> | null>(null);

	const sortedPaymentTypes = useMemo(() => paymentTypes.slice().sort((a, b) => a.name.localeCompare(b.name)), [paymentTypes]);

	const handleAdd = useCallback(async () => {
		const name = newName.trim();
		if (!name) {
			toast({ title: "Invalid name", description: "Please enter a payment type name." });
			return;
		}
		setIsSubmitting(true);
		try {
			const newId = await addPaymentType({ name, isCredit: false });
			setPendingNewId(newId as Id<"paymentTypes">);
			setIsDialogOpen(false);
			setNewName("");
			toast({ title: "Payment type added", description: "New payment type created." });
		} catch (err: any) {
			toast({ title: "Error", description: err?.message ?? "Failed to add payment type" });
		} finally {
			setIsSubmitting(false);
		}
	}, [addPaymentType, newName, toast]);

	useEffect(() => {
		if (pendingNewId) {
			onChange(pendingNewId);
			setPendingNewId(null);
		}
	}, [onChange, pendingNewId]);

	return (
		<>
			<Select
				value={value as string}
				onValueChange={(val) => {
					if (val === "__add_new__") {
						setIsDialogOpen(true);
						return;
					}
					onChange(val as Id<"paymentTypes">);
				}}
				disabled={disabled}
			>
				<SelectTrigger>
					<SelectValue placeholder="Select payment type" />
				</SelectTrigger>
				<SelectContent>
					{sortedPaymentTypes.map((pt) => (
						<SelectItem key={pt._id as string} value={pt._id as string}>
							<div className="flex items-center gap-2">
								<span>{pt.name}</span>
								{pt.isCredit ? (
									<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Credit</span>
								) : (
									<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Debit</span>
								)}
							</div>
						</SelectItem>
					))}

					<SelectItem value="__add_new__">+ Add new payment type…</SelectItem>
				</SelectContent>
			</Select>

			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Add new payment type</DialogTitle>
					</DialogHeader>
					<div className="space-y-2">
						<Input
							autoFocus
							placeholder="Payment type name"
							value={newName}
							onChange={(e) => setNewName(e.target.value)}
						/>
					</div>
					<DialogFooter>
						<Button variant="ghost" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>Cancel</Button>
						<Button onClick={handleAdd} disabled={isSubmitting || !newName.trim()}>Add</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}


