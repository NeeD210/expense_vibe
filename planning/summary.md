# Project Summary

This document provides an overview of the Expense Vibing application, detailing its database schema, backend functionalities, and frontend structure.

## Database Schema (Convex)

The database is managed using Convex and includes the following tables:

*   **`users`**: Stores user information.
    *   `auth0Id`: (String) Unique identifier from Auth0.
    *   `email`: (String) User's email address.
    *   `emailVerified`: (Boolean) Whether the email is verified.
    *   `isAnonymous`: (Optional Boolean) If the user is anonymous.
    *   `lastLoginAt`: (Optional Float64) Timestamp of the last login.
    *   `onboardingCompleted`: (Optional Boolean) Whether the user has completed onboarding.
    *   `softdelete`: (Optional Boolean) Flag for soft deletion.
    *   *Index*: `by_auth0Id` on `auth0Id`.

*   **`categories`**: Stores expense and income categories.
    *   `name`: (String) Name of the category.
    *   `userId`: (ID referencing `users`) The user who owns this category.
    *   `color`: (Optional String) Color code for the category.
    *   `icon`: (Optional String) Icon for the category.
    *   `transactionType`: (Optional String) Type of transaction ("expense" or "income").
    *   `softdelete`: (Optional Boolean) Flag for soft deletion.
    *   *Index*: `by_user` on `userId`.

*   **`paymentTypes`**: Stores user-defined payment methods.
    *   `name`: (String) Name of the payment type.
    *   `userId`: (ID referencing `users`) The user who owns this payment type.
    *   `deletedAt`: (Optional Number) Timestamp of soft deletion.
    *   `softdelete`: (Optional Boolean) Flag for soft deletion.
    *   *Index*: `by_user_softdelete` on `userId` and `softdelete`.

*   **`expenses`**: Stores all financial transactions (expenses and income).
    *   `amount`: (Float64) The transaction amount.
    *   `category`: (String) Name of the category (denormalized).
    *   `categoryId`: (Optional ID referencing `categories`) The category of the transaction.
    *   `cuotas`: (Float64) Number of installments.
    *   `date`: (Float64) Timestamp of the transaction.
    *   `description`: (String) Description of the transaction.
    *   `paymentType`: (Optional String) Name of the payment type (denormalized, though schema shows `paymentTypeId`).
    *   `paymentTypeId`: (Optional ID referencing `paymentTypes`) The payment method used.
    *   `transactionType`: (String) "expense" or "income".
    *   `userId`: (ID referencing `users`) The user who made the transaction.
    *   `deletedAt`: (Optional Number) Timestamp of soft deletion.
    *   `softdelete`: (Optional Boolean) Flag for soft deletion.
    *   `verified`: (Optional Boolean) Whether the transaction has been verified by the user.
    *   `recurringTransactionId`: (Optional ID referencing `recurringTransactions`) Reference to the recurring transaction that generated this transaction.
    *   *Index*: `by_user` on `userId`.

*   **`recurringTransactions`**: Stores recurring transaction definitions.
    *   `userId`: (ID referencing `users`) The user who owns this recurring transaction.
    *   `description`: (String) Description of the transaction.
    *   `amount`: (Float64) The transaction amount.
    *   `categoryId`: (ID referencing `categories`) The category of the transaction.
    *   `paymentTypeId`: (ID referencing `paymentTypes`) The payment method used.
    *   `transactionType`: (String) "expense" or "income".
    *   `frequency`: (String) "daily", "weekly", "monthly", or "yearly".
    *   `startDate`: (Float64) When the recurring transaction starts.
    *   `endDate`: (Optional Float64) When the recurring transaction ends.
    *   `lastProcessedDate`: (Optional Float64) When the recurring transaction was last processed.
    *   `nextDueDateCalculationDay`: (Optional Number) Day of the month for monthly/yearly transactions.
    *   `isActive`: (Boolean) Whether the recurring transaction is currently active.
    *   `softdelete`: (Optional Boolean) Flag for soft deletion.
    *   *Index*: `by_user_isActive_startDate` on `userId`, `isActive`, and `startDate`.
    *   *Index*: `by_isActive_lastProcessedDate` on `isActive` and `lastProcessedDate`.

## Backend Functions (Convex)

### Authentication (`convex/auth.ts`)
*   **`createUser` (mutation)**: Creates a new user or updates an existing one based on `auth0Id` or `email`. Initializes default categories (expense & income) and payment types for new users.
*   **`loggedInUser` (query)**: Retrieves details for the currently authenticated user.

### Expenses & Transactions (`convex/expenses.ts`)
*   **`addExpense` (mutation)**: Adds a new expense or income transaction.
*   **`listAllTransactions` (query)**: Lists all (non-soft-deleted) transactions for the current user.
*   **`listExpenses` (query)**: Lists all (non-soft-deleted) expense transactions for the current user.
*   **`listIncome` (query)**: Lists all (non-soft-deleted) income transactions for the current user.
*   **`deleteExpense` (mutation)**: Soft-deletes a transaction.
*   **`updateExpense` (mutation)**: Updates an existing transaction and marks it as verified.
*   **`verifyExpense` (mutation)**: Marks a transaction as verified without making other changes.
*   **`getLastTransaction` (query)**: Retrieves the most recent transaction for the user.
*   **`getCategories` (query)**: Retrieves category names for the user (or default if none).
*   **`getCategoriesWithIds` (query)**: Retrieves categories (name, ID, type) for the user, excluding soft-deleted.
*   **`getCategoriesWithIdsIncludingDeleted` (query)**: Retrieves all categories for the user, including soft-deleted.
*   **`initializeDefaultCategories` (mutation)**: Creates default categories if the user doesn't have any.
*   **`updateCategories` (mutation)**: Updates the user's list of categories (adds new, soft-deletes missing ones).
*   **`getPaymentTypes` (query)**: Retrieves payment types for the user.
*   **`addPaymentType` (mutation)**: Adds a new payment type for the user.
*   **`removePaymentType` (mutation)**: Soft-deletes a payment type.
*   **`initializeDefaultPaymentTypes` (mutation)**: Creates default payment types if the user doesn't have any.
*   **`updatePaymentTypes` (mutation)**: Updates the user's list of payment types (adds new, soft-deletes missing ones).

### Recurring Transactions (`convex/recurring.ts`)
*   **`addRecurringTransaction` (mutation)**: Creates a new recurring transaction.
*   **`updateRecurringTransaction` (mutation)**: Updates an existing recurring transaction.
*   **`deleteRecurringTransaction` (mutation)**: Soft-deletes a recurring transaction.
*   **`toggleRecurringTransactionStatus` (mutation)**: Activates or deactivates a recurring transaction.
*   **`listRecurringTransactions` (query)**: Lists all active recurring transactions for the current user.
*   **`processRecurringTransactions` (action)**: Processes recurring transactions that are due.
*   **`getRecurringTransactionsToProcess` (query)**: Gets recurring transactions that need to be processed.
*   **`generateTransactionFromRecurring` (mutation)**: Generates a transaction from a recurring transaction.

## Frontend (React with TypeScript)

### Core Components:
*   **`App.tsx`**: Manages authentication and navigation.
*   **`SignInForm.tsx`**: Component for user sign-in.
*   **`SignOutButton.tsx`**: Component for user sign-out.

### Pages:
*   **`HomePage.tsx`**: Dashboard with charts and recent transactions.
*   **`AnalysisPage.tsx`**: Placeholder for future analysis features.
*   **`AddExpensePage.tsx`**: Form to add new expenses.
*   **`AddIncomePage.tsx`**: Form to add new income entries.
*   **`ManageTransactionsPage.tsx`**: Lists and manages all transactions with verification workflow.
*   **`ConfigPage.tsx`**: Manages user settings and categories.

### Recurring Transactions Components:
*   **`RecurringTransactionList.tsx`**: Displays and manages recurring transactions.
*   **`RecurringTransactionForm.tsx`**: Form for creating and editing recurring transactions.

## Recent Updates

### Phase 2: Recurring Transactions & Verification Workflow (Implemented)

The application now supports creating and managing recurring transactions, which automatically generate actual transaction entries. This functionality includes:

1. **Database Structure:**
   - New `recurringTransactions` table to store recurring transaction definitions
   - Enhanced `expenses` table with `verified` status and `recurringTransactionId` field

2. **Backend Functionality:**
   - CRUD operations for recurring transactions
   - Automated transaction generation through scheduled tasks
   - Support for different frequencies (daily, weekly, monthly, yearly)
   - Auto-generated transactions are marked as unverified until user review
   - Verification workflow for reviewing auto-generated transactions

3. **User Interface:**
   - Added "Recurring Transactions" section to Manage Transactions page
   - Form for creating and editing recurring transactions with frequency settings
   - Visual indicators for unverified transactions and recurring source
   - Verification workflow with dedicated verify button for unverified transactions
   - Tabs to filter transactions by verification status (All, Verified, Unverified)

4. **Technical Enhancements:**
   - Daily processing of recurring transactions at midnight
   - Handling of different frequencies and calculation days
   - Support for specific monthly due dates
   - Integration with existing installment payment scheduling

### Next Steps

1. **Phase 3 Planning:**
   - Future payment projection and visualization
   - Enhanced reporting based on recurring patterns
   - Long-term financial forecasting 