# Context

Create comprehensive Storybook stories for React components in the patient-portal package when a user requests stories for a component. This rule should be used when:

- A user asks you to create stories for a component
- You need to demonstrate different usage patterns of a component
- A component has multiple prop combinations that should be showcased
- You're creating stories that follow the existing codebase patterns

# Process

1. **Examine the component thoroughly**:

   - Read the component file to understand all props and their types
   - Identify if the component uses other components from the codebase (like StyledList, StyledListItem)
   - Note if it's a compound component pattern (e.g., Component.SubComponent)
   - Check for any styling dependencies or required containers

2. **Study existing story patterns**:

   - Look at existing `.stories.tsx` files in the same package
   - Use `file_search` to find similar story files for reference
   - Copy the import structure, meta configuration, and story patterns
   - Match the existing naming conventions and story titles

3. **Create comprehensive story file**:

   - Place in `packages/patient-portal/src/stories/components/[ComponentName].stories.tsx`
   - Import the component and any required dependencies
   - Include common Material-UI components: `Typography`, `Box`, `Chip`, and relevant icons
   - Set up meta configuration with proper title, component, parameters, and argTypes
   - Add `tags: ['autodocs']` for documentation generation

4. **Create these core stories**:

   - **Default**: Basic usage with string props
   - **WithIconLabel**: React node label with icon + string value
   - **WithChipValue**: String label + React node value (using Chip)
   - **WithComplexContent**: Both label and value as complex React nodes
   - **MultipleItems**: Multiple components together (most important for demonstrating real usage)
   - **MixedContentTypes**: Different combinations showing flexibility

5. **Ensure proper component context**:

   - If component uses `StyledListItem`, wrap in `StyledList` or `LabelValueList`
   - If component requires Material-UI containers, include them
   - Use compound component patterns correctly (e.g., `LabelValueList.ListItem`)
   - Test that components render in their intended context

6. **Add proper documentation**:
   - Include component description explaining its purpose and usage
   - Add story-specific descriptions for complex examples
   - Document the main benefits (e.g., "perfect alignment" for grid-based components)
   - Use patient/medical context for examples to match the domain

# Avoid

- Creating stories that don't render components in their proper container context (e.g., ListItem components outside of Lists)
- Using generic examples instead of medical/patient portal relevant content
- Not following existing story patterns and naming conventions from the codebase
- Creating stories that only show individual components when the main benefit is multiple components working together
- Skipping the MultipleItems story type - this is often the most important story for demonstrating real-world usage

# Notes

Use Australian/NZ English spelling and terminology throughout the stories and documentation. Use "colour" instead of "color" in descriptions, "centre" instead of "center", and other Commonwealth English conventions.
