# Context

Use this rule when a user wants to update copy/text for translated buttons, strings, or other UI elements in the frontend. This applies when the user describes a frontend component they want to change the wording for, whether it's a button label, error message, form field label, or any other translatable text.

# Process

1. **Get user input**: Ask the user to describe the frontend component and the current text they want to change, along with what they want it to say instead.

2. **Locate the translation files**: Search for the current text in the codebase to find where the translation strings are defined (typically in translation/localization files).

3. **Update the fallback text**: Change the fallback/default text to the new wording the user requested.

4. **Update the stringId**: If the wording has changed meaningfully (i.e. not just a typo tweak, added conjunction, or change in pluralisation), update the stringId to reflect the new text.

5. **Search for all instances**: Use search tools to find all places in the codebase where the old stringId or text is used to ensure consistency.

6. **Check with user for broader updates**: If you find other instances of the same or similar text being used elsewhere in the codebase, present these findings to the user and ask if they want those updated as well.

7. **Make the changes**: Update all confirmed instances, ensuring the stringId changes are reflected everywhere the string is used.

# Avoid

- Changing stringIds unnecessarily when only minor wording tweaks are made
- Updating text without checking if it's used in multiple places
- Making assumptions about whether related strings should be updated without asking the user

# Notes

- Always use Australian/NZ English spelling and terminology in the updated text (e.g., "colour" not "color", "centre" not "center")
- When updating medical or clinical terminology, ensure it aligns with Australian/NZ medical conventions
- Be thorough in searching for all instances to maintain consistency across the application
