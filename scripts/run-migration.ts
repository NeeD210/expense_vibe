import { execSync } from "child_process";

async function main() {
  try {
    console.log("Running migration to remove nextDueDate field...");
    execSync("npx convex run migrations:removeNextDueDateField", { stdio: "inherit" });
    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    process.exit(0);
  }
}

main(); 