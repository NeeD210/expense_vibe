# Convex Migrations Guide

## What are Migrations?

Migrations are the process of changing the shape of data in your database. They typically involve two main components:

1. **Schema Changes**: Modifications to the structure of your tables (field names and types)
2. **Data Changes**: Transformations of existing data to match the new schema

## Types of Migrations

### Offline Migrations
- Stop serving traffic
- Run the migration
- Start serving with new code
- **Risks**:
  - Difficult to roll back if new code has bugs
  - High-stress operation if migration fails
  - Requires downtime

### Online Migrations (Recommended)
- Database continues serving requests while data updates asynchronously
- More complex but avoids downtime
- Better for large systems
- **Considerations**:
  - Need to handle both old and new schema formats
  - May require multiple deployments
  - Rules and constraints may be more complex during transition

## Best Practices

1. **Create New Fields Instead of Changing Types**
   - Add new fields rather than modifying existing ones
   - Use `v.union` for type transitions
   - Wait until all data is migrated before removing old fields

2. **Preserve Data**
   - Don't delete data unless absolutely necessary
   - Mark deprecated fields as optional
   - Add comments explaining deprecated fields
   - Use `v.optional` for fields that will be removed

3. **Handle Both Formats During Migration**
   - Support both old and new data formats
   - TypeScript types will automatically handle this through schema validation

4. **Separate Schema and Code Changes**
   - Push schema changes before code changes
   - This allows rolling back code changes if needed
   - Schema validation ensures compatibility

5. **Clean Up After Migration**
   - Remove old format references
   - Ensure no readers/writers use old format
   - Verify all data is migrated

## Migration Strategies

### Dual Write (Preferred)
1. Write both formats, read old format
2. Migrate data asynchronously
3. Update code to read new format
4. Update code to only use new format

### Dual Read
1. Read both formats (prefer new)
2. Write only new format
3. Migrate data asynchronously
4. Update code to only read new format

### Combined Approach
1. Write and read both formats
2. Migrate data asynchronously
3. Update code to only use new format

## Implementation

### Installation
```bash
npm install @convex-dev/migrations
```

### Configuration
Create a `convex.config.ts` file:
```typescript
// convex/convex.config.ts
import { defineApp } from "convex/server";
import migrations from "@convex-dev/migrations/convex.config";

const app = defineApp();
app.use(migrations);

export default app;
```

### Example Migration
```typescript
export const setDefaultValue = migrations.define({
  table: "users",
  migrateOne: async (ctx, user) => {
    if (user.optionalField === undefined) {
      await ctx.db.patch(user._id, { optionalField: "default" });
    }
  },
});
```

### Running Migrations

#### Programmatically
```typescript
await migrations.runOne(ctx, internal.migrations.setDefaultValue);
```

#### CLI
```bash
npx convex run migrations:run '{fn: "setDefaultValue"}'
```

### Production Deployment
```bash
npx convex deploy --cmd 'npm run build' && npx convex run convex/migrations.ts:runAll --prod
```

## Advanced Configuration

### Custom Batch Size
```typescript
export const clearField = migrations.define({
  table: "myTable",
  batchSize: 10,
  migrateOne: () => ({ optionalField: undefined }),
});
```

### Parallel Processing
```typescript
export const clearField = migrations.define({
  table: "myTable",
  parallelize: true,
  migrateOne: () => ({ optionalField: undefined }),
});
```

## Migration State
- Tracks migration progress
- Prevents duplicate runs
- Resumes from last successful point
- Provides real-time status via Convex queries

## Common Migration Steps
1. Modify schema to support both old and new formats
2. Update code to handle both versions
3. Define and push migration
4. Run migration to completion
5. Update schema and code to use new format only

Remember: Schema validation will prevent deployment if the schema doesn't match the data, ensuring safe migrations. 