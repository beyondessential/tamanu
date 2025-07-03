# Context

Use this rule when porting components from the old web app (`packages/web/`) to the shared library (`packages/shared/src/ui/components/`) that need to be modernised with MUI v6 and proper TypeScript support. This typically applies when:

- You encounter components using `@material-ui/core` imports (old MUI v4)
- Components are using `styled-components` for styling
- TypeScript linter errors indicate missing prop types or interfaces
- Components have mixed styling approaches or lack proper type safety

# Process

1. **Analyse the existing component structure**:

   - Check imports for old MUI packages (`@material-ui/core`)
   - Identify styled-components usage
   - Note any TypeScript errors related to prop types
   - Understand the component's functionality and styling requirements

2. **Update imports to MUI v6**:

   - Replace `@material-ui/core` with `@mui/material`
   - Import `styled` from `@mui/material/styles` if needed
   - Remove `styled-components` imports

3. **Create proper TypeScript interfaces**:

   - Define a props interface with all component properties
   - Use optional properties with sensible defaults
   - Include proper types (e.g., `string | number` for size props)

4. **Choose the appropriate styling approach**:

   - **Use `sx` prop** for simple components with 1-2 style properties
   - **Use `styled` API** for components with 3+ style properties or complex styling logic
   - Create a separate styled component interface if using `styled`

5. **Implement the styling**:

   - For `sx` approach: Use MUI's Box component with sx prop
   - For `styled` approach: Create a styled component with typed props and move all styles into the styled function
   - Preserve CSS grid, flexbox, and positioning logic from the original

6. **Update component implementation**:

   - Use ES6 default parameters in the function signature
   - Add proper TypeScript generics to `React.memo`
   - Add `displayName` for better debugging
   - Preserve all data-testid attributes for testing

7. **Verify the transformation**:
   - Ensure all TypeScript errors are resolved
   - Check that the component maintains the same API and behaviour
   - Test that styling works as expected

# Avoid

- Don't mix `sx` prop with `styled` API in the same component - choose one approach based on complexity
- Don't remove or change data-testid attributes as these are used by existing tests
- Don't change the component's public API or prop names unless absolutely necessary
- Don't forget to add TypeScript interfaces - this is what eliminates most linter errors

# Notes

Use Australian/NZ English spelling and terminology in comments and documentation (e.g., "colour" not "color", "centre" not "center").
