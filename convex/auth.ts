import { convexAuth, getAuthUserId } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

const defaultPaymentTypes = [
  "Efectivo o Transferencia",
  "Tarjeta 1",
  "Tarjeta 2"
];

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Password],
});

export const createUser = mutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.db.insert("users", {
      email: args.email,
      isAnonymous: false,
    });

    // Create default payment types for the new user
    for (const paymentTypeName of defaultPaymentTypes) {
      await ctx.db.insert("paymentTypes", {
        name: paymentTypeName,
        userId,
        softdelete: false,
      });
    }

    return userId;
  },
});

export const loggedInUser = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }
    const user = await ctx.db.get(userId);
    if (!user) {
      return null;
    }
    return user;
  },
});
