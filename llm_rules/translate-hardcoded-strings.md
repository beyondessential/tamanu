# Context

This rule covers the process of converting hardcoded English text strings in React components to use the TranslatedText internationalization system. This is a common task for making the Tamanu healthcare application accessible to international users.

# Process

## Self-Update After Usage

**IMPORTANT**: When this rule is used in a conversation, the AI should:

1. **Complete the translation task** following the steps below
2. **Observe what happened** during the session (new patterns, challenges, solutions)
3. **Extract learnings** from the usage:
   - New successful patterns to add to Process section
   - New gotchas or anti-patterns for Avoid section
   - Better approaches that improve existing steps
   - Edge cases or context not previously covered
4. **Update this rule file** by editing the appropriate sections with the new learnings
5. **Document the update** by noting what was learned and added

## Basic String Translation

1. **Import TranslatedText**: Add `import { TranslatedText } from './Translation/TranslatedText';` (adjust path as needed)
2. **Wrap hardcoded text**: Replace `"Hardcoded Text"` with:
   ```jsx
   <TranslatedText
     stringId="appropriate.category.key"
     fallback="Hardcoded Text"
     data-testid="translatedtext-descriptive-name"
   />
   ```
3. **Choose appropriate string IDs**: Follow patterns like:
   - `general.action.*` for common actions (save, cancel, add, search, etc.)
   - `error.*` for error messages
   - `auth.*` for authentication related text
   - `note.*` for note-related functionality
   - `vaccine.*` for vaccine/immunization content
   - `patient.*` for patient-specific content

## Messages with Dynamic Content

1. **For simple variables**: Use replacement tokens:
   ```jsx
   <TranslatedText
     stringId="message.with.variable"
     fallback="You have :count items remaining"
     replacements={{ count: itemCount }}
   />
   ```
2. **For complex styled content**: Use split approach:
   ```jsx
   <TranslatedText stringId="message.prefix" fallback="Text before " />
   <span style={{fontWeight: 'bold'}}>{dynamicContent}</span>
   <TranslatedText stringId="message.suffix" fallback=" text after" />
   ```
3. **Prefer replacements over splitting** when the dynamic content is just simple variables or strings

## TranslatedEnum for Enums

1. **For enum values**: Use TranslatedEnum instead of TranslatedText:
   ```jsx
   <TranslatedEnum
     value={enumValue}
     enumValues={ENUM_LABELS_CONSTANT}
     data-testid="translatedenum-descriptive"
   />
   ```
2. **Import enum constants**: Usually from `@tamanu/constants`

## String ID Naming Conventions

- Use dot notation: `category.subcategory.specific`
- Make reusable IDs for common actions: `general.action.save`
- Be specific for domain content: `vaccine.certificate.covid19.title`
- Use consistent prefixes for related functionality

# Avoid

- **Complex styled JSX in replacements**: Don't put styled JSX elements as replacement values - they won't work with the translation factory
- **Unnecessary message splitting**: Don't split messages when simple variable replacements would work fine
- **Non-descriptive string IDs**: Avoid IDs like `text1` or `button.click` - be specific about purpose
- **Overly specific IDs**: Don't create `patientListView.saveButton.text` when `general.action.save` would be reusable
- **Missing fallback text**: Always provide the original English text as fallback
- **Inconsistent test ID patterns**: Follow `translatedtext-descriptive-name` format
- **Forgetting imports**: Remember to add TranslatedText import when adding translations

# Notes

- The translation system uses a replacement factory that expects React components to have `stringId` and `fallback` props
- TranslatedEnum components are registered in the enum registry and have automatic string ID generation
- Common actions like "Save", "Cancel", "Add" should use `general.action.*` IDs for maximum reusability
- Simple variable replacements (like `:count`, `:name`, `:timeoutHours`) are preferred over splitting messages
- Only split messages when you need to insert complex styled JSX that can't be handled by replacements

# Recent Updates

**2024 Session**: Clarified that simple variable replacements are preferred over message splitting. Updated guidance to only split when dealing with complex styled JSX content, not simple variables.
