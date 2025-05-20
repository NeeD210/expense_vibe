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
    *   *Index*: `by_user` on `userId`.

## Backend Functions (Convex - in `convex/expenses.ts` and `convex/auth.ts`)

### Authentication (`convex/auth.ts`)
*   **`createUser` (mutation)**: Creates a new user or updates an existing one based on `auth0Id` or `email`. Initializes default categories (expense & income) and payment types for new users.
*   **`loggedInUser` (query)**: Retrieves details for the currently authenticated user.

### Expenses & Transactions (`convex/expenses.ts`)
*   **`addExpense` (mutation)**: Adds a new expense or income transaction.
*   **`listAllTransactions` (query)**: Lists all (non-soft-deleted) transactions for the current user.
*   **`listExpenses` (query)**: Lists all (non-soft-deleted) expense transactions for the current user.
*   **`listIncome` (query)**: Lists all (non-soft-deleted) income transactions for the current user.
*   **`deleteExpense` (mutation)**: Soft-deletes a transaction.
*   **`updateExpense` (mutation)**: Updates an existing transaction.
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

## Frontend (React with TypeScript - in `src/`)

The main application is structured in `src/App.tsx` which handles authentication and navigation.

### Core Components:
*   **`App.tsx`**:
    *   Manages authentication state using Auth0 and Convex.
    *   Calls `api.auth.createUser` on user login.
    *   Handles client-side navigation between pages.
    *   Displays a bottom navigation bar.
*   **`SignInForm.tsx`**: Component for user sign-in.
*   **`SignOutButton.tsx`**: Component for user sign-out.

### Pages (`src/pages/`):

*   **`HomePage.tsx`**:
    *   Displays a dashboard with charts (current month expense doughnut chart, income vs. expenses combined chart).
    *   Lists recent transactions.
    *   Uses: `api.expenses.listExpenses`, `api.expenses.listAllTransactions`, `api.expenses.getCategoriesWithIdsIncludingDeleted`, `api.expenses.getPaymentTypes`.

*   **`AnalysisPage.tsx`**:
    *   Currently a placeholder page ("Analysis coming soon...").
    *   No backend calls.

*   **`AddExpensePage.tsx`**:
    *   Form to add a new expense.
    *   Prefills category/payment type from last transaction or defaults.
    *   Uses: `api.expenses.getCategoriesWithIds`, `api.expenses.getPaymentTypes`, `api.expenses.getLastTransaction`, `api.expenses.addExpense`.

*   **`AddIncomePage.tsx`**:
    *   Form to add a new income entry.
    *   Uses: `api.expenses.getCategoriesWithIds`, `api.expenses.addExpense` (with `transactionType: "income"`).

*   **`ManageTransactionsPage.tsx`**:
    *   Lists all transactions (income and expenses).
    *   Allows editing and deleting transactions (swipe-to-delete).
    *   Has a "Recurring" section (currently seems to be a placeholder or WIP).
    *   Uses: `api.expenses.listAllTransactions`, `api.expenses.getCategoriesWithIdsIncludingDeleted`, `api.expenses.getPaymentTypes`, `api.expenses.updateExpense`, `api.expenses.deleteExpense`.

*   **`ConfigPage.tsx`**:
    *   Manages user settings:
        *   Expense Categories (add/remove)
        *   Income Categories (add/remove)
        *   Payment Types (add/remove)
    *   Includes a sign-out button.
    *   Uses: `api.expenses.getCategoriesWithIds`, `api.expenses.getPaymentTypes`, `api.expenses.updateCategories`, `api.expenses.addPaymentType`, `api.expenses.removePaymentType`. 