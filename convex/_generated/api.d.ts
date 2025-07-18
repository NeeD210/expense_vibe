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
import type * as cache from "../cache.js";
import type * as crons from "../crons.js";
import type * as expenses from "../expenses.js";
import type * as http from "../http.js";
import type * as internal_expenses from "../internal/expenses.js";
import type * as internal_index from "../internal/index.js";
import type * as internal_recurring from "../internal/recurring.js";
import type * as internal_ from "../internal.js";
import type * as migrations_category from "../migrations/category.js";
import type * as migrations_expenseCategory from "../migrations/expenseCategory.js";
import type * as migrations_index from "../migrations/index.js";
import type * as migrations_run from "../migrations/run.js";
import type * as migrations from "../migrations.js";
import type * as projections from "../projections.js";
import type * as recurring from "../recurring.js";

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
  cache: typeof cache;
  crons: typeof crons;
  expenses: typeof expenses;
  http: typeof http;
  "internal/expenses": typeof internal_expenses;
  "internal/index": typeof internal_index;
  "internal/recurring": typeof internal_recurring;
  internal: typeof internal_;
  "migrations/category": typeof migrations_category;
  "migrations/expenseCategory": typeof migrations_expenseCategory;
  "migrations/index": typeof migrations_index;
  "migrations/run": typeof migrations_run;
  migrations: typeof migrations;
  projections: typeof projections;
  recurring: typeof recurring;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
