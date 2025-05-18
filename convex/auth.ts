import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";

const defaultPaymentTypes = [
  "Efectivo o Transferencia",
  "Tarjeta 1",
  "Tarjeta 2"
];

const defaultExpenseCategories = [
  "Vivienda",
  "Servicios",
  "Transporte",
  "Alimentación",
  "Seguros y Salud",
  "Deudas",
  "Ropa",
  "Hogar y electrónica",
  "Ocio",
  "Mascotas",
  "Educación",
  "Otras"
];

const defaultIncomeCategories = [
  "Salario",
  "Freelance",
  "Inversiones",
  "Regalo",
  "Reembolso",
  "Otros Ingresos"
];

export const createUser = mutation({
  args: {
    email: v.string(),
    auth0Id: v.string(),
  },
  handler: async (ctx, args) => {
    // First check if user exists with this auth0Id
    const existingUserByAuth0Id = await ctx.db
      .query("users")
      .withIndex("by_auth0Id", (q) => q.eq("auth0Id", args.auth0Id))
      .unique();

    if (existingUserByAuth0Id) {
      // User already exists with this auth0Id, update lastLoginAt
      await ctx.db.patch(existingUserByAuth0Id._id, { lastLoginAt: Date.now() });
      return existingUserByAuth0Id._id;
    }

    // Check if user exists with this email
    const existingUserByEmail = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();

    if (existingUserByEmail) {
      // User exists with this email but different auth0Id
      // Link the new auth0Id to the existing account
      await ctx.db.patch(existingUserByEmail._id, {
        auth0Id: args.auth0Id,
        lastLoginAt: Date.now()
      });
      return existingUserByEmail._id;
    }

    // No existing user found, create new user
    const userId = await ctx.db.insert("users", {
      email: args.email,
      auth0Id: args.auth0Id,
      isAnonymous: false,
      emailVerified: true, // Assuming email is verified via Auth0
      lastLoginAt: Date.now(),
      softdelete: false,
    });

    // Create default payment types for the new user
    for (const paymentTypeName of defaultPaymentTypes) {
      await ctx.db.insert("paymentTypes", {
        name: paymentTypeName,
        userId,
        softdelete: false,
      });
    }

    // Create default expense categories for the new user
    for (const categoryName of defaultExpenseCategories) {
      await ctx.db.insert("categories", {
        name: categoryName,
        userId,
        transactionType: "expense",
        softdelete: false,
      });
    }

    // Create default income categories for the new user
    for (const categoryName of defaultIncomeCategories) {
      await ctx.db.insert("categories", {
        name: categoryName,
        userId,
        transactionType: "income",
        softdelete: false,
      });
    }

    return userId;
  },
});

export const loggedInUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("auth0Id"), identity.tokenIdentifier))
      .first();

    return user ?? null;
  },
});
