# Context

This rule captures the successful workflow for creating new synthetic test scenarios in the Tamanu codebase. The process involves creating multiple interconnected components: database schemas, fake data generators, hooks for payload generation, and Artillery YAML scenarios for load testing.

The workflow was successfully demonstrated when creating an encounter creation scenario, which required:

- Understanding the existing codebase structure and patterns
- Creating or updating database schemas
- Building fake data generators with proper date formatting
- Developing hooks that fetch real data and generate test payloads
- Creating Artillery YAML scenarios for load testing
- Handling authentication and API integration properly

This rule preserves the learnings from that successful implementation to guide future synthetic test scenario creation.

# Process

## 1. Analyze Existing Patterns

First, examine the existing synthetic test structure to understand the established patterns:

```bash
# Explore the synthetic-tests package structure
ls packages/synthetic-tests/src/
# Look at existing hooks, scenarios, and utils
```

Key files to examine:

- `packages/synthetic-tests/src/hooks/` - Existing hook patterns
- `packages/synthetic-tests/src/scenarios/` - YAML scenario examples
- `packages/synthetic-tests/src/utils/` - Utility functions like `getRandomPatient`

## 2. Create Database Schema (if needed)

If the resource doesn't have a schema, create one in the appropriate package:

```bash
# For facility-server resources
touch packages/facility-server/app/routes/apiv1/[resource]/[resource].schema.js
```

Follow the existing schema patterns:

- Use Zod for validation
- Include proper field descriptions
- Mark foreign keys with `__foreignKey__` in descriptions
- Use appropriate data types (string, number, boolean, etc.)

## 3. Create Fake Data Generator

Create a fake data generator in the `fake-data` package:

```bash
# Create the fake data file
touch packages/fake-data/src/fake/fakeRequest/create[Resource].ts
```

Key requirements:

- Use `@anatine/zod-mock` for schema-based generation
- Import the schema from the appropriate package
- Handle date formatting correctly (use `faker.date.recent().toISOString()` for ISO format)
- Use the `processMock` utility for handling foreign keys and excluded fields
- Use options object pattern for flexible parameter handling
- Export a properly typed function with full TypeScript support

Example structure:

```typescript
import { z } from 'zod';
import { generateMock } from '@anatine/zod-mock';
import { createResourceSchema } from '@tamanu/facility-server/schemas/resource.schema';
import { processMock } from './utils';

type CreateResourceOptions = {
  required: {
    // Required foreign key fields
  };
  excludedFields?: (keyof z.infer<typeof createResourceSchema>)[];
  overrides?: Partial<z.infer<typeof createResourceSchema>>;
};

export const fakeCreateResourceRequestBody = (options: CreateResourceOptions) => {
  const { required, excludedFields = [], overrides = {} } = options;

  const mock = generateMock(createResourceSchema, {
    stringMap: {
      // Custom string generators
    },
  });

  return {
    ...processMock(createResourceSchema, mock, excludedFields),
    ...overrides,
    ...required,
  };
};
```

### 3.1 Create Utility Functions for Mock Processing

Create utility functions in `packages/fake-data/src/fake/fakeRequest/utils.ts`:

```typescript
import { z } from 'zod';

export const overrideForeignKeys = (schemaShape: z.ZodRawShape, mock: Record<string, any>) => {
  for (const key in schemaShape) {
    const schema = schemaShape[key];
    if (typeof schema.description === 'string' && schema.description.includes('__foreignKey__')) {
      mock[key] = undefined;
    }
  }
  return mock;
};

export const removeExcludedFields = <T extends z.ZodTypeAny>(
  mock: Record<string, any>,
  excludedFields: (keyof z.infer<T>)[],
) => {
  for (const key of excludedFields) {
    delete mock[key as string];
  }
  return mock;
};

export const processMock = <T extends z.ZodObject<any>>(
  schema: T,
  mock: Record<string, any>,
  excludedFields: (keyof z.infer<T>)[] = [],
) => {
  // First override foreign keys
  overrideForeignKeys(schema.shape, mock);

  // Then remove excluded fields
  removeExcludedFields(mock, excludedFields);

  return mock;
};
```

## 4. Create Hook for Payload Generation

Create a hook in the synthetic-tests package:

```bash
# Create the hook file
touch packages/synthetic-tests/src/hooks/create[Resource].ts
```

Hook requirements:

- Use `fetch` for API calls (NOT Playwright APIRequestContext)
- Import the fake data generator
- Import utility functions like `getRandomPatient`
- Generate realistic test data
- Store results in `context.vars` for Artillery to use
- Include comprehensive JSDoc documentation

Example structure:

```typescript
import { getRandomPatient } from '../utils/getRandomPatient';
import { fakeCreateResourceRequestBody } from '@tamanu/fake-data/fake/fakeRequest/createResource';

export async function generateResourcePayload(context: any, _events: any): Promise<void> {
  const { target, token, facilityId } = context.vars;

  // Get required related data
  const randomPatient = await getRandomPatient(target, token, facilityId);

  // Create payload using fake data with options object pattern
  const resourcePayload = fakeCreateResourceRequestBody({
    required: {
      patientId: randomPatient.id,
      // Other required fields
    },
    overrides: {
      // Custom overrides for testing
    },
  });

  context.vars.resourcePayload = resourcePayload;
  context.vars.selectedPatient = randomPatient;
}
```

## 5. Create Artillery YAML Scenario

Create a YAML scenario file:

```bash
# Create the scenario file
touch packages/synthetic-tests/src/scenarios/create[Resource]Scenario.ts
```

Scenario requirements:

- Import the hook function
- Define proper authentication flow
- Include the hook in the `beforeScenario` section
- Create the actual API request using the generated payload
- Handle response validation
- Include proper error handling

Example structure:

```typescript
import { generateResourcePayload } from '../hooks/createResource';

export const createResourceScenario = {
  name: 'Create Resource',
  weight: 10,
  beforeScenario: async (context: any, events: any) => {
    await generateResourcePayload(context, events);
  },
  requests: [
    {
      method: 'POST',
      url: '{{ baseUrl }}/api/v1/resources',
      headers: {
        Authorization: 'Bearer {{ token }}',
        'Content-Type': 'application/json',
      },
      body: '{{ resourcePayload }}',
      capture: [
        {
          json: '$.id',
          as: 'resourceId',
        },
      ],
    },
  ],
};
```

## 6. Update Package Dependencies

Ensure the synthetic-tests package has the necessary dependencies:

```bash
# Add to packages/synthetic-tests/package.json if needed
npm install @tamanu/fake-data
```

## 7. Build and Test

Build the fake-data package and test the scenario:

```bash
# Build fake-data package
cd packages/fake-data && npm run build

# Test the scenario
cd packages/synthetic-tests && npm run test
```

# Avoid

## Common Pitfalls

1. **Using Playwright APIRequestContext in hooks**: Always use `fetch` for API calls in hooks, not Playwright's APIRequestContext.

2. **Incorrect date formatting**: Use `faker.date.recent().toISOString()` for ISO format dates, not `formatISO9075`.

3. **Missing foreign key handling**: Always use the `processMock` utility to handle foreign keys properly.

4. **Incomplete context variables**: Ensure all required context variables (baseUrl, token, facilityId, userId) are available.

5. **Missing facilityId in API calls**: Always include facilityId when fetching patients or other facility-scoped resources.

6. **Hardcoded values**: Use dynamic data generation instead of hardcoded values for realistic testing.

7. **Missing error handling**: Include proper error handling in hooks and scenarios.

8. **Poor function signatures**: Avoid positional parameters for optional values - use options object pattern for better flexibility and type safety.

9. **Inconsistent type safety**: Always use generic types with Zod schemas to ensure excluded fields are valid schema keys.

## Anti-Patterns

- Don't create hooks that directly create resources - they should only generate payloads
- Don't use synchronous operations in hooks - always use async/await
- Don't skip the fake data generation step - it's essential for realistic testing
- Don't forget to rebuild the fake-data package after changes
- Don't create scenarios without proper authentication flows
- Don't use hardcoded schema references in utility functions - make them generic
- Don't use positional parameters for optional values - use named parameters with options objects

# Recent Updates

- **2024-12-26**: Initial rule creation based on successful encounter creation scenario implementation. Learned about proper date formatting, foreign key handling, and the importance of using fetch instead of Playwright APIRequestContext in hooks.

- **2024-12-26**: Enhanced fake data generators with improved type safety and flexible parameter patterns. Key learnings:
  - Use options object pattern instead of positional parameters for better flexibility
  - Implement generic utility functions that work with any Zod schema
  - Create `processMock` utility that combines foreign key handling and field exclusion
  - Use `(keyof z.infer<T>)[]` for type-safe excluded fields that only accept valid schema keys
  - Provide sensible defaults for optional parameters (empty arrays for excludedFields)
  - Ensure TypeScript autocomplete and type checking for field names

---

# 🔴 CRITICAL REMINDER: UPDATE THIS RULE AFTER USE

**After completing any synthetic test scenario creation task using this rule, you MUST update this file with:**

1. **New patterns** discovered during the session
2. **Gotchas or anti-patterns** encountered
3. **Better approaches** that improve existing steps
4. **Edge cases** not previously covered
5. **Corrections** to existing guidance that proved incorrect

**Add an entry in the "Recent Updates" section above with the session date and learnings.**

**This step is MANDATORY and cannot be skipped!**
