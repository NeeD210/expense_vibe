/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as auth from "../auth.js";
import type * as expenses from "../expenses.js";
import type * as http from "../http.js";
import type * as migrations_category from "../migrations/category.js";
import type * as migrations_expenseCategory from "../migrations/expenseCategory.js";
import type * as migrations_index from "../migrations/index.js";
import type * as migrations_paymentType from "../migrations/paymentType.js";
import type * as migrations_run from "../migrations/run.js";
import type * as transactions from "../transactions.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  expenses: typeof expenses;
  http: typeof http;
  "migrations/category": typeof migrations_category;
  "migrations/expenseCategory": typeof migrations_expenseCategory;
  "migrations/index": typeof migrations_index;
  "migrations/paymentType": typeof migrations_paymentType;
  "migrations/run": typeof migrations_run;
  transactions: typeof transactions;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
