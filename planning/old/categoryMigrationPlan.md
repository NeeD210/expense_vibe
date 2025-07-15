# Category Migration Plan

## Current State
- Categories are currently stored as an array of strings in the `userPreferences` table
- We need to create a new `categories` table to store categories as proper documents
- Each category will be associated with a user

## Migration Goals
1. Create a new `categories` table with proper document structure
2. Migrate existing categories from `userPreferences` to the new `categories` table
3. Update all related queries and mutations to use the new category structure
4. Maintain backward compatibility during migration

## Migration Strategy
We'll use the Dual Write approach with improvements based on the payment type migration:

### Phase 1: Schema Updates
1. Create new `categories` table:
   ```typescript
   categories: defineTable({
     name: v.string(),
     userId: v.id("users"),
     // Optional fields for future extensibility
     color: v.optional(v.string()),
     icon: v.optional(v.string()),
   }).index("by_user", ["userId"])
   ```
2. Keep existing categories array in `userPreferences` during migration
3. Update TypeScript types to reflect new schema

### Phase 2: Data Migration
1. Create a migration function to:
   - Query all user preferences
   - For each user:
     - Process their categories array
     - Create corresponding category documents
     - Track migration progress
   - Handle duplicates and edge cases
   - Implement batch processing for better performance

### Phase 3: Code Updates
1. Update all queries to use new category structure
2. Update all mutations to handle both old and new fields
3. Update UI components to work with new data structure
4. Add proper error handling and validation

### Phase 4: Cleanup
1. Remove old categories array from `userPreferences` schema
2. Update all code to use only new category structure
3. Remove migration-related code

## Detailed Tasks

### Schema Changes
- [ ] Create new categories table with proper indexes
- [ ] Update userPreferences schema to mark categories array as optional
- [ ] Update TypeScript types for new schema

### Migration Function
- [ ] Create migration function to:
  - [ ] Query all user preferences
  - [ ] For each user:
    - [ ] Process their categories array
    - [ ] Create category documents
    - [ ] Handle duplicates
  - [ ] Implement batch processing
  - [ ] Add progress tracking
  - [ ] Add error handling and logging
  - [ ] Add retry mechanism for failed operations

### Code Updates
- [ ] Update category creation mutations
- [ ] Update category query functions
- [ ] Update category update mutations
- [ ] Update UI components to handle new data structure
- [ ] Add validation for new category structure
- [ ] Update any existing category-related business logic

### Testing
- [ ] Test migration function with sample data
- [ ] Test backward compatibility
- [ ] Test new category functionality
- [ ] Test error handling and edge cases
- [ ] Test UI updates
- [ ] Test performance with large datasets

### Deployment Steps
1. Deploy schema changes
2. Run migration function
3. Deploy code updates
4. Verify data consistency
5. Remove old categories array

## Rollback Plan
1. Keep old categories array during migration
2. Maintain backup of original data
3. Create rollback migration if needed
4. Document rollback procedures
5. Add monitoring for migration progress

## Timeline Estimate
- Schema Changes: 1 day
- Migration Function: 2-3 days (including improvements from payment type migration)
- Code Updates: 2-3 days
- Testing: 2-3 days
- Deployment: 1 day
- Total: 8-11 days

## Risks and Mitigations
1. **Data Loss**
   - Mitigation: Keep old categories array during migration
   - Backup data before migration
   - Add data validation checks

2. **Performance Impact**
   - Mitigation: Implement efficient batch processing
   - Add progress monitoring
   - Optimize database queries

3. **UI Disruption**
   - Mitigation: Support both old and new structures during transition
   - Gradual UI updates
   - Add proper loading states

4. **Migration Failures**
   - Mitigation: Implement robust retry mechanism
   - Add detailed logging
   - Create comprehensive rollback procedures
   - Add monitoring and alerts

5. **Duplicate Categories**
   - Mitigation: Implement deduplication logic
   - Add validation for category names
   - Handle case sensitivity properly

## Improvements from Payment Type Migration
1. Better batch processing implementation
2. More robust error handling
3. Improved progress tracking
4. Better handling of edge cases
5. More comprehensive testing strategy
6. Added monitoring and alerts
7. Better rollback procedures 