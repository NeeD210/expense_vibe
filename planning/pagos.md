# Payment and Recurring Transactions Implementation Plan

Phase 1: Advanced Installment Scheduling ("Cuotas" Management) ✅
Goal: To allow users to accurately track expenses made with multiple installments ("cuotas"). Each installment will have a precisely calculated due date based on enhanced payment type configurations. All expenses will still be manually entered at this stage.

1. Database Schema Changes (Convex): ✅

paymentTypes Table: ✅
✅ Add isCredit: boolean (Default: false. If true, uses closingDay/dueDay logic; if false, due date is transaction date).
✅ Add closingDay: number | null (Integer 1-31, day of month for billing cycle close; applicable if isCredit is true).
✅ Add dueDay: number | null (Integer 1-31, day of month for payment due; applicable if isCredit is true).
✅ (No change to existing name, userId, softdelete fields)
✅ Index: by_user_softdelete (existing).

expenses Table: ✅
✅ Add nextDueDate: number (Timestamp: Due date of the first/next installment).
✅ Add verified: boolean (Default: true. All expenses in this phase are manual, hence verified).
✅ Add recurringTransactionId: string | null (Type: ID referencing recurringTransactions. Default: null. To be actively used in Phase 2).
✅ (No change to existing amount, category, categoryId, cuotas, date, description, paymentTypeId, transactionType, userId, softdelete fields)
✅ Index: by_user (existing).

paymentSchedules Table (NEW): ✅
✅ userId: string (Type: ID referencing users).
✅ expenseId: string (Type: ID referencing expenses).
✅ paymentTypeId: string (Type: ID referencing paymentTypes, denormalized from expense for easier schedule queries).
✅ amount: number (Float64: Amount for this specific installment).
✅ dueDate: number (Float64: Timestamp for this installment's due date).
✅ installmentNumber: number (Float64: The sequence number of this installment, e.g., 1, 2, 3).
✅ totalInstallments: number (Float64: Total number of installments for the parent expense).
✅ softdelete: boolean (Optional Boolean: Flag for soft deletion, mirrors parent expense).
✅ Indexes: by_expenseId on expenseId, by_user_dueDate on (userId, dueDate).

2. Backend Logic & API Endpoints (Convex): ✅

convex/auth.ts: ✅
✅ Modify createUser (mutation):
When initializing default payment types for a new user:
Default "Cash", "Debit Card", etc.: isCredit = false, closingDay = null, dueDay = null.
Default "Credit Card": isCredit = true, closingDay = null (or a common placeholder like 25), dueDay = null (or a common placeholder like 10). Prompt users to configure these.

convex/expenses.ts: ✅
✅ Modify addPaymentType (mutation - api.expenses.addPaymentType):
Include isCredit, closingDay, dueDay in function arguments and stored data.
Add validation: if isCredit is true, closingDay and dueDay should be between 1-31.
✅ Modify updatePaymentTypes (mutation - api.expenses.updatePaymentTypes):
Handle updates to isCredit, closingDay, dueDay including validation.
✅ Modify getPaymentTypes (query - api.expenses.getPaymentTypes):
Ensure new fields (isCredit, closingDay, dueDay) are returned.
✅ Create Internal Helper Mutation internal.expenses.generatePaymentSchedules:
Not directly callable by client.
Parameters: expenseId: string, firstDueDate: number, totalAmount: number, totalInstallments: number (from expense.cuotas), userId: string, paymentTypeId: string.
Logic:
If totalInstallments is 1: Create a single paymentSchedules entry with amount = totalAmount, dueDate = firstDueDate, installmentNumber = 1.
If totalInstallments > 1:
installmentAmount = totalAmount / totalInstallments.
Loop from i = 1 to totalInstallments:
currentDueDate: For i = 1, currentDueDate = firstDueDate.
For i > 1, currentDueDate is firstDueDate with (i-1) months added. (Implement robust month addition, e.g., date-fns addMonths or similar, handling differing month lengths).
Create paymentSchedules entry with installmentAmount, currentDueDate, installmentNumber = i.
All entries should include userId, expenseId, paymentTypeId, totalInstallments, and softdelete = false.
✅ Create Internal Helper Mutation internal.expenses.deletePaymentSchedulesForExpense:
Not directly callable by client.
Parameter: expenseId: string.
Logic: Finds all paymentSchedules entries where expenseId matches and sets their softdelete = true.
✅ Rework addExpense (mutation - api.expenses.addExpense):
Existing logic for transactionType, category, etc.
Set verified = true.
Set recurringTransactionId = null.
Calculate nextDueDate:
Fetch the paymentType record using args.paymentTypeId.
If paymentType.isCredit is true and paymentType.closingDay and paymentType.dueDay are set:
Determine the billing cycle for args.date based on paymentType.closingDay.
Calculate nextDueDate based on that cycle's paymentType.dueDay. (Example: If date=Jan 26, closingDay=25, dueDay=10: nextDueDate is Feb 10. If date=Jan 20, closingDay=25, dueDay=10: nextDueDate is Feb 10. If date=Jan 26, closingDay=28, dueDay=15: nextDueDate is Feb 15.)
Else (paymentType.isCredit is false or days not set): nextDueDate = args.date.
Save the new expense to the expenses table including the calculated nextDueDate, verified, and recurringTransactionId.
Call await ctx.runMutation(internal.expenses.generatePaymentSchedules, { expenseId: newExpense._id, firstDueDate: newExpense.nextDueDate, ... }).
✅ Rework updateExpense (mutation - api.expenses.updateExpense):
Fetch the existing expense.
Apply updates from args to the expense data.
Set verified = true.
If args.date or args.paymentTypeId (or args.cuotas, args.amount) changed:
Recalculate nextDueDate if args.date or args.paymentTypeId changed, using the same logic as in addExpense.
Update the expense record in the database.
Call await ctx.runMutation(internal.expenses.deletePaymentSchedulesForExpense, { expenseId: args.id }).
Call await ctx.runMutation(internal.expenses.generatePaymentSchedules, { expenseId: updatedExpense._id, firstDueDate: updatedExpense.nextDueDate, ... }).
Else (only minor fields like description changed): Just update the expense record.
✅ Rework deleteExpense (mutation - api.expenses.deleteExpense):
Perform soft deletion on the expense record.
Call await ctx.runMutation(internal.expenses.deletePaymentSchedulesForExpense, { expenseId: args.id }).

3. Frontend Structure & Components (React with TypeScript): ✅

src/pages/ConfigPage.tsx: ✅
✅ Modify forms for adding/editing Payment Types:
Add checkbox/toggle for isCredit.
Conditionally display input fields for closingDay and dueDay (numeric, 1-31) if isCredit is checked.

src/pages/AddExpensePage.tsx & src/pages/AddIncomePage.tsx: ✅
✅ No major changes to user input fields for cuotas. The backend now handles detailed scheduling.

src/pages/ManageTransactionsPage.tsx: ✅
(Optional for Phase 1, but highly recommended for testing and user visibility): When a user views details of an expense with cuotas > 1, display a list of its generated paymentSchedules (each showing installment number, due date, and amount). This might involve fetching from paymentSchedules table based on expenseId.

4. Deliverables/Outcomes for Phase 1:

✅ Users can configure payment types with credit card-like billing cycle details (isCredit, closingDay, dueDay).
✅ When adding or updating an expense with installments (cuotas), the system automatically calculates and stores a nextDueDate for the first installment.
✅ Individual payment schedules are generated in the paymentSchedules table for each installment, with subsequent due dates calculated as +1 month from the previous.
Users (optionally) can see the breakdown of their installment payments.

Phase 2: Recurring Transactions & Verification Workflow ✅
Goal: To enable users to define recurring transactions (both expenses and income) that automatically generate transaction entries in the system. Introduce a verification workflow for these auto-generated transactions.

1. Database Schema Changes (Convex): ✅

recurringTransactions Table (NEW): ✅
✅ userId: string (Type: ID referencing users).
✅ description: string.
✅ amount: number (Float64).
✅ categoryId: string (Type: ID referencing categories).
✅ paymentTypeId: string (Type: ID referencing paymentTypes).
✅ transactionType: string ("expense" or "income").
✅ frequency: string (Enum: "daily", "weekly", "monthly", "yearly").
✅ startDate: number (Float64: Timestamp for when the recurrence begins).
✅ endDate: number | null (Optional Float64: Timestamp for when the recurrence ends).
✅ lastProcessedDate: number | null (Optional Float64: Timestamp of when the last expense instance was generated from this recurrence).
✅ nextDueDateCalculationDay: number | null (Optional Integer 1-31: Specific day of the month to target for the date of the generated expense, which then influences nextDueDate calculation. E.g., for a salary paid on the 15th, this would be 15).
✅ isActive: boolean (Default: true. User can pause/resume).
✅ softdelete: boolean (Optional Boolean).
✅ Indexes: by_user_isActive_startDate on (userId, isActive, startDate), by_isActive_nextProcessing on (isActive, lastProcessedDate) (or a dedicated calculated nextProcessingDate field if preferred for job querying).
2. Backend Logic & API Endpoints (Convex): ✅

convex/recurring.ts: ✅
✅ Create CRUD Mutations for recurringTransactions:
api.recurring.addRecurringTransaction
api.recurring.updateRecurringTransaction
api.recurring.deleteRecurringTransaction (soft delete)
These should handle all fields including transactionType, frequency, nextDueDateCalculationDay, etc., with appropriate validation.
✅ Create Scheduled Function (e.g., cron.processRecurringTransactions):
Runs periodically (e.g., daily).
Logic:
Query recurringTransactions table for records where isActive = true, softdelete = false, startDate is in the past, endDate is in the future (or null), and it's time to process based on frequency and lastProcessedDate.
For each due recurringTransaction:
Determine the expenseDate for the new transaction. If nextDueDateCalculationDay is set for a monthly/yearly frequency, use that day of the current month/year. Otherwise, use the current date.
Call api.expenses.addExpense (or a specialized internal mutation if preferred to bypass some manual defaults) with data from the recurringTransaction:
Pass amount, categoryId, paymentTypeId, description, userId, transactionType.
Pass the determined expenseDate as date.
Pass cuotas (typically 1, unless recurring installments are a feature).
Crucially, set isAutoGenerated = true or pass recurringTransactionId to addExpense so it can set verified = false and link the ID. (Modify addExpense from Phase 1 to accept an optional isAutoGenerated flag or recurringId to set verified = false and recurringTransactionId accordingly. If isAutoGenerated is not passed or false, it behaves as in Phase 1).
If expense creation is successful, update lastProcessedDate on the recurringTransactions record.
✅ Modify api.expenses.addExpense:
Add optional parameter _recurringTransactionId: string | null = null.
If _recurringTransactionId is provided:
Set newExpense.verified = false.
Set newExpense.recurringTransactionId = _recurringTransactionId.
Else (manual entry):
newExpense.verified = true.
newExpense.recurringTransactionId = null.
The rest of addExpense (calculating nextDueDate, calling _generatePaymentSchedules) remains the same.
api.expenses.updateExpense:
The existing logic that sets verified = true upon any modification correctly handles the verification workflow for auto-generated expenses.
3. Frontend Structure & Components (React with TypeScript): ✅

New Components: ✅
✅ RecurringTransactionForm.tsx: Form for creating/editing recurring transactions (fields: description, amount, category, payment type, transaction type, frequency, start/end dates, nextDueDateCalculationDay, active toggle).
✅ RecurringTransactionList.tsx: Component to display a list of recurring transactions with options to edit/delete/toggle active status.
src/pages/ManageTransactionsPage.tsx: ✅
✅ Added a new tab or section for "Recurring Transactions" which uses RecurringTransactionList.tsx and RecurringTransactionForm.tsx (via modal/drawer).
✅ In the main transactions list:
Visually distinguish expenses that are not yet verified (e.g., an icon, different background color, a "Verify" button).
✅ If recurringTransactionId is present, optionally display an icon or link to navigate to the parent recurring transaction.
✅ Editing any field of an unverified transaction will trigger api.expenses.updateExpense, which sets verified = true.
4. Deliverables/Outcomes for Phase 2:

Users can define and manage recurring expenses and income.
The system automatically generates transaction entries based on these definitions.
Auto-generated transactions appear as "unverified" in the system, prompting user review.
Editing an auto-generated transaction marks it as "verified".
Installment scheduling from Phase 1 seamlessly applies to these auto-generated transactions if they have cuotas > 1.
Phase 3: Future Payment Projection & Visualization (In Progress)
Goal: To provide users with a clear forecast of their upcoming financial obligations and income, consolidating scheduled installments and active recurring transactions.

1. Backend Logic & API Endpoints (Convex):

convex/expenses.ts (or convex/projections.ts):
Create/Refine Query api.projections.getProjectedPayments:
Parameters: userId: string, dateRangeStart: number, dateRangeEnd: number.
Logic:
Scheduled Installments: Fetch all paymentSchedules for the userId where softdelete = false and dueDate falls within dateRangeStart and dateRangeEnd. Map these to a common projection item format (e.g., { date, amount, description, type: 'installment', originalExpenseId, categoryId, paymentTypeId }).
Future Recurring Transactions:
Fetch all recurringTransactions for the userId where isActive = true, softdelete = false, and the recurrence period overlaps with the dateRange.
For each active recurringTransaction, simulate its future occurrences within the dateRangeStart and dateRangeEnd based on its frequency, startDate, endDate, and lastProcessedDate.
For each simulated occurrence, determine its expenseDate (considering nextDueDateCalculationDay) and estimate its nextDueDate (by fetching its paymentType and applying isCredit logic). Map these to the common projection item format (e.g., { date (estimated due date), amount, description, type: 'recurring', recurringTransactionId, categoryId, paymentTypeId, transactionType }).
Combine the lists of items from installments and simulated recurring transactions.
Sort the combined list by date.
Return the sorted list.
Consider pagination if the result set can be very large, though typically projections are for a few months.
Implement caching for this query if performance becomes an issue for common date ranges.
2. Frontend Structure & Components (React with TypeScript):

New Page (src/pages/ProjectionPage.tsx):
Purpose: To display future financial projections.
Fetch data using api.projections.getProjectedPayments.
Include controls for selecting the date range (e.g., next month, next 3 months, custom range).
Visualization Components:
List View: A chronological list of projected payments/income, showing date, description, amount, type (installment/recurring), and perhaps category/payment type.
Calendar View: (Optional but valuable) A calendar highlighting days with projected transactions, with amounts summarized per day.
Summary Statistics: Totals for projected expenses, income, and net flow for the selected period. Charts (e.g., pie chart of expenses by category, bar chart of income vs. expense over time) for the projected period.
Allow filtering (e.g., by transaction type, category, payment type) and sorting of the list view.
src/pages/HomePage.tsx (Optional Enhancements):
Consider adding a small section or widget to the dashboard that shows a summary of upcoming payments for the next 7 or 30 days, derived from api.projections.getProjectedPayments.
Bottom Navigation Bar (App.tsx):
Add a new navigation item linking to the ProjectionPage.tsx.
3. Deliverables/Outcomes for Phase 3:

Users can access a dedicated "Projections" page.
Users can view a forecast of their future financial events (scheduled installments and upcoming recurring transactions) in list and/or calendar formats.
Users can see summary statistics and charts for their projected finances.
Improved financial planning capability for users.

### Implementation Steps
1. Update `ManageTransactionsPage.tsx`: ✅
   - Add recurring transactions section
   - Implement edit/delete functionality
   - Add status indicators
2. Create new components: ✅
   - `RecurringTransactionForm.tsx`
   - `RecurringTransactionList.tsx`
3. Add validation and error handling: ✅
4. Implement optimistic updates: ✅

## Technical Considerations

### Performance ✅
- Implemented efficient indexing for all new tables
- Added pagination support
- Implemented caching for frequently accessed data
- Set up background jobs for heavy calculations

### Security ✅
- Added proper authorization checks
- Implemented input validation
- Added rate limiting
- Implemented audit logging

### Testing (In Progress)
- Unit tests for new functions (Pending)
- Integration tests for critical flows (Pending)
- End-to-end tests for main user journeys (Pending)
- Performance tests for heavy operations (Pending)

## Migration Plan
1. Deploy database schema changes ✅
2. Implement backend functionality ✅
3. Add frontend components ✅
4. Test thoroughly in staging (In Progress)
5. Deploy to production (Pending)
6. Monitor for issues (Pending)
