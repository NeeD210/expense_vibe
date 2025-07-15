# Payment Type Migration Plan

## Current State
- `paymentType` is currently stored as a string in the `expenses` table
- `paymentTypes` table already exists with `name` and `userId` fields
- `userPreferences` table has a `paymentTypes` array of strings

## Migration Goals
1. Convert `paymentType` in `expenses` table from string to `Id<"paymentTypes">`
2. Ensure data consistency across all tables
3. Maintain backward compatibility during migration
4. Update all related queries and mutations

## Migration Strategy
We'll use the Dual Write approach as recommended in the migrations guide:

### Phase 1: Schema Updates
1. Add new field to `expenses` table:
   ```typescript
   paymentTypeId: v.optional(v.id("paymentTypes"))
   ```
2. Keep existing `paymentType` field as optional during migration
3. Update TypeScript types to reflect new schema

### Phase 2: Data Migration
1. Create a migration function to:
   - Query all expenses
   - For each expense:
     - Find or create corresponding payment type
     - Update expense with new paymentTypeId
     - Keep old paymentType string for backward compatibility

### Phase 3: Code Updates
1. Update all queries to use new paymentTypeId field
2. Update all mutations to handle both old and new fields
3. Update UI components to work with new data structure

### Phase 4: Cleanup
1. Remove old paymentType field from schema
2. Update all code to use only new paymentTypeId field
3. Remove any migration-related code

## Detailed Tasks

### Schema Changes
- [ ] Add paymentTypeId field to expenses table
- [ ] Make paymentType field optional in expenses table
- [ ] Update TypeScript types

### Migration Function
- [ ] Create migration function to:
  - [ ] Query all expenses
  - [ ] For each expense:
    - [ ] Find matching payment type by name
    - [ ] Create payment type if not exists
    - [ ] Update expense with paymentTypeId
  - [ ] Handle error cases and logging
  - [ ] Add progress tracking

### Code Updates
- [ ] Update expense creation mutations
- [ ] Update expense query functions
- [ ] Update expense update mutations
- [ ] Update UI components to handle new data structure
- [ ] Add validation for new paymentTypeId field

### Testing
- [ ] Test migration function with sample data
- [ ] Test backward compatibility
- [ ] Test new payment type functionality
- [ ] Test error handling
- [ ] Test UI updates

### Deployment Steps
1. Deploy schema changes
2. Run migration function
3. Deploy code updates
4. Verify data consistency
5. Remove old field

## Rollback Plan
1. Keep old paymentType field during migration
2. Maintain backup of original data
3. Create rollback migration if needed
4. Document rollback procedures

## Timeline Estimate
- Schema Changes: 1 day
- Migration Function: 2 days
- Code Updates: 2-3 days
- Testing: 2 days
- Deployment: 1 day
- Total: 8-9 days

## Risks and Mitigations
1. **Data Loss**
   - Mitigation: Keep old field during migration
   - Backup data before migration

2. **Performance Impact**
   - Mitigation: Run migration in batches
   - Monitor system performance

3. **UI Disruption**
   - Mitigation: Support both old and new fields during transition
   - Gradual UI updates

4. **Migration Failures**
   - Mitigation: Implement retry mechanism
   - Log all migration steps
   - Create rollback procedures
