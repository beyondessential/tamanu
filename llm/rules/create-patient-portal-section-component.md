# Context

Use this rule when creating a new section component for the patient portal that displays patient data in an accordion format. This rule builds on the `create-patient-portal-usequery-hook.md` rule for data fetching.

Apply this rule when:

- Creating a new section component for the patient portal dashboard
- You have a description of what data the section should display
- Optionally, you have a design photo or mockup to reference
- The section needs to fetch and display patient-specific data
- The component should integrate with the existing AccordionSection pattern

# Process

1. **Analyze the requirements and identify data needs**:

   - Read the section description carefully to understand what data needs to be displayed
   - If a design photo is provided, analyze it for:
     - Layout patterns (list vs grid vs cards)
     - Information hierarchy and typography styles
     - Interactive elements (buttons, links, etc.)
     - Empty state handling
   - Determine what backend data model and endpoint will be needed
   - Follow the `create-patient-portal-usequery-hook.md` rule to create the data-fetching hook first
   - **Important**: After creating new schemas in the shared package, run `npm run build-shared` from the project root to make them available to other packages

2. **Create a skeleton component file**:

   - Name it `[FeatureName]Section.tsx` in `packages/patient-portal/src/components/sections/`
   - Start with a basic skeleton structure:

     ```typescript
     import React from 'react';
     import { AccordionSection } from '../AccordionSection';
     import { Typography } from '@mui/material';
     import { [RelevantIcon] } from 'lucide-react';

     export const [FeatureName]Section = () => {
       return (
         <AccordionSection header="[Section Title]" icon={<[RelevantIcon] />}>
           <Typography>Coming soon...</Typography>
         </AccordionSection>
       );
     };
     ```

3. **Create the Storybook story**:

   - Create `[FeatureName]Section.stories.tsx` in `packages/patient-portal/src/stories/sections/`
   - Follow this template structure:

     ```typescript
     import type { Meta, StoryObj } from '@storybook/react';
     import { [FeatureName]Section } from '../../components/sections/[FeatureName]Section';

     const meta: Meta<typeof [FeatureName]Section> = {
       title: 'Patient Portal/Sections/[FeatureName]Section',
       component: [FeatureName]Section,
       parameters: {
         layout: 'padded',
       },
     };

     export default meta;
     type Story = StoryObj<typeof meta>;

     export const Default: Story = {};

     export const LoadingState: Story = {
       // Will be updated once hook is integrated
     };

     export const EmptyState: Story = {
       // Will be updated once hook is integrated
     };
     ```

   - This allows you to see the skeleton component immediately and iterate on the design

4. **Implement the full component with data fetching**:

   - Add the hook import and data fetching logic:

     ```typescript
     import React from 'react';
     import { AccordionSection } from '../AccordionSection';
     import { ListItemText, Typography } from '@mui/material';
     import { [RelevantIcon] } from 'lucide-react';

     import { use[FeatureName]Query } from '../../api/queries/use[FeatureName]Query';
     import { StyledList, StyledListItem } from '../StyledList';
     import { StyledCircularProgress } from '../StyledCircularProgress';

     export const [FeatureName]Section = () => {
       const { data: items, isLoading } = use[FeatureName]Query();

       return (
         <AccordionSection header="[Section Title]" icon={<[RelevantIcon] />}>
           {isLoading ? (
             <StyledCircularProgress size={24} />
           ) : items && items.length > 0 ? (
             // Main content rendering
           ) : (
             <Typography color="text.secondary">No [feature] recorded.</Typography>
           )}
         </AccordionSection>
       );
     };
     ```

5. **Choose appropriate components for data display**:

   - **For simple lists**: Use `StyledList`, `StyledListItem`, `ListItemText` (custom styled components)
   - **For complex lists with actions**: Add `ListItemIcon`, `ListItemSecondaryAction` with `StyledListItem`
   - **For card-like layouts**: Use `Card`, `CardContent`, `CardHeader`
   - **For tabular data**: Use `Table`, `TableHead`, `TableBody`, `TableRow`, `TableCell`
   - **For key-value pairs**: Use `Typography` with consistent styling
   - **For dates/timestamps**: Use consistent date formatting utilities
   - **For loading states**: Use `StyledCircularProgress` with `size={24}` prop
   - Always use `Typography` with appropriate variants (`body1`, `body2`, `subtitle1`, etc.)

6. **Implement the three rendering states**:

   - **Loading state**: `StyledCircularProgress` with `size={24}` prop
   - **Data present state**: Main content using appropriate styled components (e.g., `StyledList`, `StyledListItem`)
   - **Empty state**: `Typography` with `color="text.secondary"` and descriptive message

7. **Select an appropriate Lucide React icon**:

   - Choose an icon that semantically represents the section content
   - Import only the specific icon needed
   - Examples: `Stethoscope` for conditions, `Pill` for medications, `Calendar` for appointments

8. **Identify potential reusable components**:

   - **Before implementing**, consider if any parts could be extracted into reusable components:
     - **Date display patterns**: If displaying dates/timestamps consistently
     - **Status indicators**: If showing status badges or chips
     - **Action buttons**: If sections have similar action patterns
     - **Information cards**: If displaying structured information in card format
     - **List item patterns**: If multiple sections use similar list item layouts
   - **Ask the user**: "I notice this section could benefit from [X reusable component]. Should I create a shared component for [specific pattern] that could be reused across other sections?"
   - **Examples of reusable patterns to look for**:
     - Medical condition display with severity indicators
     - Medication display with dosage and frequency
     - Appointment display with time and provider information
     - Document/attachment display with download actions

9. **Keep the component simple and focused**:

   - Each section should have a single responsibility
   - Avoid complex logic - delegate to custom hooks or utility functions
   - Use direct destructuring from the query hook
   - Minimise props - most patient portal sections won't need external configuration

10. **Add proper TypeScript types**:

    - Import types from the corresponding schema: `import type { [FeatureName] } from '@tamanu/shared/dtos/responses/[FeatureName]Schema'`
    - Use proper typing for any props (though most sections won't have props)
    - Ensure the data transformation in the hook provides the exact type the component expects

11. **Update the Storybook story with proper variants**:

    - Update the story to showcase the different component states using the MockedApi decorator
    - Follow this enhanced structure:

      ```typescript
      import type { Meta, StoryObj } from '@storybook/react-vite';
      import { [FeatureName]Section } from '../../components/sections/[FeatureName]Section';
      import { MockedApi } from '../utils/mockedApi';

      // TODO - ideally this could use fake data package
      const mockData = {
        data: [
          {
            id: 'item-1',
            // Add all fields matching your schema exactly
            // Use realistic data for the feature
          },
          // Add more mock items
        ],
        count: 2,
      };

      const meta: Meta<typeof [FeatureName]Section> = {
        title: 'Components/Sections/[FeatureName]Section',
        component: [FeatureName]Section,
        parameters: {
          layout: 'padded',
        },
        tags: ['autodocs'],
        decorators: [
          Story => (
            <MockedApi endpoints={{ '/patient/me/[endpoint-name]': () => mockData }}>
              <Story />
            </MockedApi>
          ),
        ],
      };

      export default meta;
      type Story = StoryObj<typeof meta>;

      export const Default: Story = {};

      export const EmptyState: Story = {
        decorators: [
          Story => (
            <MockedApi
              endpoints={{
                '/patient/me/[endpoint-name]': () => ({
                  data: [],
                  count: 0,
                }),
              }}
            >
              <Story />
            </MockedApi>
          ),
        ],
      };

      export const LoadingState: Story = {
        decorators: [
          Story => (
            <MockedApi
              endpoints={{
                '/patient/me/[endpoint-name]': () => new Promise(() => {}), // Never resolves to show loading state with StyledCircularProgress
              }}
            >
              <Story />
            </MockedApi>
          ),
        ],
      };

      export const CustomData: Story = {
        decorators: [
          Story => (
            <MockedApi
              endpoints={{
                '/patient/me/[endpoint-name]': () => ({
                  data: [/* custom test scenarios */],
                  count: 1,
                }),
              }}
            >
              <Story />
            </MockedApi>
          ),
        ],
      };
      ```

    - Use the `MockedApi` decorator pattern with endpoint configuration functions
    - The LoadingState uses a Promise that never resolves to simulate loading
    - Each story variant uses its own decorator to override the API response
    - Include a TODO comment about potentially using the fake data package for more realistic data

12. **Test the component with different data states**:

    - Verify the component renders correctly with mock data in Storybook
    - Test loading state using the LoadingState story
    - Test empty state using the EmptyState story
    - Ensure responsive design works on different screen sizes
    - Test the component in the actual application with real API integration

# Avoid

- Don't create overly complex components - keep them focused on displaying data from a single hook
- Don't add unnecessary props or configuration - patient portal sections should be self-contained
- Don't implement data fetching logic in the component - use the dedicated hook pattern
- Don't hardcode styling - use MUI's theme system and consistent Typography variants
- Don't forget to implement all three states (loading, data, empty)
- Don't choose generic icons - select icons that clearly represent the section's purpose
- Don't miss opportunities to identify reusable patterns that could become shared components
- Don't skip creating the story early - it's essential for iterative development and testing
- Don't implement the full component before creating the skeleton and story - the early story enables faster iteration
- Don't forget to run `npm run build-shared` after creating new schemas in the shared package - this will cause TypeScript compilation errors

# Notes

Use Australian/NZ English spelling and terminology throughout the code (e.g., "colour", "summarise", "organise"). For medical terminology, use internationally recognised terms and codes.

Always follow the established pattern of using AccordionSection as the wrapper component, as this provides consistent styling and behaviour across all patient portal sections.

**Styled Components**: Use the custom styled components (`StyledList`, `StyledListItem`, `StyledCircularProgress`) instead of basic MUI components. These provide consistent styling and spacing that matches the patient portal design system.

The skeleton-first, story-early approach enables rapid iteration and design validation. Use Storybook as your primary development environment - it allows you to test different states, data scenarios, and responsive behaviour without needing the full application context.

When identifying reusable components, focus on patterns that appear in multiple designs rather than creating premature abstractions. The goal is to balance simplicity with reusability.

**Build Process**: The shared package uses TypeScript compilation and needs to be built whenever new schemas are added. The `npm run build-shared` command compiles all shared packages and makes their exports available to consuming packages like patient-portal. Without this step, TypeScript will show "Cannot find module" errors when trying to import new schemas.
