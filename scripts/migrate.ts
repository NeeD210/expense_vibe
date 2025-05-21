import { ConvexClient } from "convex/browser";
import { api } from "../convex/_generated/api";

// Initialize the Convex client
const client = new ConvexClient(process.env.NEXT_PUBLIC_CONVEX_URL!, {
  unsavedChangesWarning: false
});

async function runMigration() {
  try {
    console.log("Starting payment schedules migration...");
    
    const result = await client.mutation(api.expenses.migratePaymentSchedules, {});
    
    console.log(`Migration completed successfully!`);
    console.log(`Migrated ${result.migratedCount} expenses to payment schedules.`);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

// Run the migration
runMigration(); 