# Context

Use this rule when creating a new useQuery hook in the `packages/patient-portal/src/api/queries/` directory, especially when you need to mock data for development and match a backend API structure.

Apply this rule when:

- Creating a new data-fetching hook for patient portal components
- You need to add mock data for development before the backend endpoint is ready
- The backend API returns a `{data: [...], count: N}` structure that needs transformation
- You want to filter or transform the API response data before components use it
- Creating patient-specific endpoints that will be implemented under `/patient/me/` or similar patterns

# Process

1. **Research the backend API structure first**:

   - Use `codebase_search` to find existing similar endpoints and their data structures
   - Look for the backend model (e.g., `PatientCondition`) to understand field names and types
   - Check test files to see expected API response formats
   - Find existing web app query hooks that might use similar endpoints
   - **Note**: Patient portal endpoints will be newly created under `/patient/me/` patterns (e.g., `/patient/me/ongoing-conditions`) but will return data in similar structure to existing facility server endpoints

2. **Create Zod schemas in shared/dtos based on research**:

   - **Response schemas**: Create in `packages/shared/src/dtos/responses/[FeatureName]Schema.ts`
   - **Pattern**: Use PascalCase naming, e.g., `OngoingConditionSchema`, `AllergySchema`
   - **Structure**: Follow this pattern based on the backend model you researched:

     ```typescript
     import { z } from 'zod';
     import { ReferenceDataSchema } from './ReferenceDataSchema'; // If needed

     export const [FeatureName]Schema = z.object({
       id: z.string(),
       // Add all database fields matching the backend model exactly
       note: z.string(),
       recordedDate: z.string(),
       resolved: z.boolean(),
       resolutionDate: z.string().nullable(),
       patientId: z.string(),
       conditionId: z.string(),
       examinerId: z.string(),
       // Include nested reference data objects
       condition: ReferenceDataSchema,
     });

     export const [FeatureName]sArraySchema = z.array([FeatureName]Schema);
     export type [FeatureName] = z.infer<typeof [FeatureName]Schema>;
     ```

   - **Match backend exactly**: Use the exact field names and types from the backend model
   - **Reuse existing schemas**: Import and reuse `ReferenceDataSchema` for nested reference data objects
   - **Nullable fields**: Use `.nullable()` for fields that can be null in the database
   - **Array schemas**: Always create both singular and array versions

3. **Create the hook file** in `packages/patient-portal/src/api/queries/`:

   - Name it `use[FeatureName]Query.ts` (e.g., `useOngoingConditionsQuery.ts`)
   - Import required dependencies:
     ```typescript
     import { useQuery } from '@tanstack/react-query';
     import {
       [FeatureName]sArraySchema,
       [FeatureName]Schema,
       type [FeatureName],
     } from '@tamanu/shared/dtos/responses/[FeatureName]Schema';
     import { useApi } from '../useApi';
     import { useAuth } from '@auth/useAuth';
     ```

4. **Add mock data toggle and realistic mock data**:

   - Add `const USE_MOCK_DATA = false;` flag at the top (set to false for production)
   - Create mock data that exactly matches the schema structure:
     ```typescript
     const mock[FeatureName]sData = {
       data: [
         {
           id: 'item-1',
           // Match all fields from the schema exactly
           note: 'Realistic medical note',
           recordedDate: '2023-01-15T10:00:00.000Z',
           resolved: false,
           resolutionDate: null,
           patientId: 'patient-123',
           conditionId: 'ref-condition-1',
           examinerId: 'examiner-1',
           condition: {
             id: 'ref-condition-1',
             name: 'Condition Name',
             code: 'ICD10-CODE',
             type: 'diagnosis',
           },
         },
         // Add multiple realistic examples
       ],
       count: 2,
     };
     ```
   - Use realistic medical/healthcare data with proper codes (ICD-10, etc.)
   - Structure as `{data: [...], count: N}` if that's the backend format

5. **Create data transformation function with Zod validation**:

   - Add a `transformData` function that validates and transforms the response:

     ```typescript
     const transformData = (response: { data: unknown; count: number }): [FeatureName][] => {
       if (!response?.data) {
         return [];
       }

       const parsedData = [FeatureName]sArraySchema.parse(response.data);
       return parsedData.filter((item: [FeatureName]) => !item.resolved); // Add filtering logic
     };
     ```

   - Use the array schema to validate incoming data
   - Add filtering logic as needed (e.g., filter out resolved conditions)
   - Handle null/undefined responses gracefully

6. **Implement the hook with proper TypeScript generics**:

   ```typescript
   export const use[FeatureName]Query = () => {
     const api = useApi();
     const { user } = useAuth();

     return useQuery<{ data: unknown; count: number }, Error, [FeatureName][]>({
       queryKey: ['feature-name', user?.id],
       queryFn: USE_MOCK_DATA
         ? () => Promise.resolve(mock[FeatureName]sData)
         : () => api.get('/patient/me/endpoint-name'),
       enabled: !!user?.id,
       select: transformData,
     });
   };
   ```

7. **Export the hook and ensure components receive clean data**:
   - The hook should return the transformed data array directly
   - Components should be able to use `const { data: items, isLoading } = useHook()`
   - No need for components to do additional data extraction

# Avoid

- Don't create mock data with custom field names that don't match the backend model - always match the exact database structure
- Don't skip creating Zod schemas - they provide crucial type safety and runtime validation
- Don't make components extract data from `response.data` - handle this in the hook's select function
- Don't forget to add proper TypeScript generics to the useQuery hook
- Don't use conditional hook calls (like `if (USE_MOCK_DATA) return mockHook()`) - this violates React hooks rules
- Don't assume existing endpoints can be used directly - patient portal needs new `/patient/me/` endpoints that filter data for the authenticated patient
- Don't duplicate schemas - reuse existing ones like `ReferenceDataSchema` for nested objects

# Notes

Use Australian/NZ English spelling and terminology throughout the code (e.g., "colour", "summarise", "organise"). For medical terminology, use internationally recognised terms and codes.

Patient portal endpoints will be newly implemented on the backend under `/patient/me/` patterns but will return data structures similar to existing facility server endpoints, just filtered for the current patient context.

The Zod schemas ensure type safety at both compile time and runtime, preventing data-related bugs and providing clear contracts between frontend and backend.
