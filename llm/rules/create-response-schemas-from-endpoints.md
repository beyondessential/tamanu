# Context

Use this rule when you need to create or update Zod response schemas for API endpoints, especially when you have actual response data from the frontend to supplement your understanding of the endpoint structure. This applies when:

- Creating new schemas in `packages/shared/src/dtos/responses/`
- Updating existing schemas to be more comprehensive
- Working with complex nested response objects that include multiple database entities
- You have real response data showing the actual structure returned by endpoints

# Process

## 1. Analyse the Response Structure

- Examine the actual response data from the frontend to understand the complete structure
- Identify each database entity/table represented in the response (these will become separate schemas)
- Note which fields are nullable, which are computed/custom fields, and which are nested relationships

## 2. Search for Constants

- Use `codebase_search` to find relevant constants in `packages/constants/` for enum fields
- Look for patterns like `VACCINE_STATUS`, `ENCOUNTER_TYPES`, `VISIBILITY_STATUSES`, etc.
- Identify which fields should use enum validation vs plain strings

## 3. Create Entity Schemas Systematically

- Start with the most basic entities (those with no dependencies on other schemas)
- Work your way up to more complex entities that reference others
- Use this order: ReferenceData → Facility → LocationGroup → User → Department → Location → Encounter → ScheduledVaccine → AdministeredVaccine

## 4. Create Missing Schemas First

- For each new schema file, include all fields from the response data
- Use proper imports for constants: `import { CONSTANT_NAME } from '@tamanu/constants'`
- Use `z.enum(Object.values(CONSTANT) as [string, ...string[]])` for enum fields (never use `z.nativeEnum()`)
- Include common database fields: `id`, `createdAt`, `updatedAt`, `deletedAt`, `updatedAtSyncTick`, `visibilityStatus`
- Mark nullable fields appropriately with `.nullable()`

## 5. Update Existing Schemas

- Check if schemas already exist in the responses directory
- Add missing fields from the actual response data
- Update to use proper enum constants instead of plain strings
- Add nested schema relationships using imports and optional chaining

## 6. Structure Nested Relationships

- For nested objects, import the related schema: `import { RelatedSchema } from './RelatedSchema'`
- Use `.optional()` for nested objects that might not always be included
- Use `.nullable()` for nested objects that can be null
- Structure associations to match the actual response nesting

## 7. Handle Computed Fields

- Include custom computed fields from the endpoint (like `vaccineDisplayName`, `displayLocation`)
- Mark these as `.optional()` since they're added by the backend
- Document with comments when fields are computed vs direct database fields

## 8. Create Todo List for Complex Tasks

- Use `todo_write` to track progress when dealing with multiple schemas
- Mark tasks as `in_progress` before starting, `completed` when finished
- This helps manage dependencies between schemas

## 9. Validate Schema Structure

- Ensure the final schema matches the actual response structure exactly
- Include export statements: `export type EntityName = z.infer<typeof EntityNameSchema>`
- Create array schemas where needed: `export const EntitiesArraySchema = z.array(EntitySchema)`

# Avoid

- Using `z.nativeEnum()` - it's deprecated, always use `z.enum(Object.values(...) as [string, ...string[]])`
- Creating schemas without examining actual response data - this leads to incomplete or incorrect schemas
- Missing nullable fields - check the real data to see which fields can be null
- Forgetting to import constants for enum validation - use the constants package consistently
- Creating schemas without proper nested relationships - the response structure should guide the schema structure
- Assuming field types without verification - strings might be numbers, arrays might be nullable

# Notes

- Always use Australian/NZ English spelling in schema field names and comments (e.g., "colour" not "color", "organisation" not "organization")
- When creating type exports, use PascalCase matching the schema name minus "Schema" (e.g., `AdministeredVaccineSchema` exports `AdministeredVaccine`)
- Group related imports together and sort them logically (constants first, then local schemas)
- Use descriptive comments to explain computed fields or complex relationships
