# Important Project Rules - Tamanu

This file contains essential project-specific information for LLM agents working on Tamanu.

## Project Overview

- Load the initial overview document: `llm/docs/initial-overview.md`
- This gives foundational knowledge about the Tamanu healthcare platform
- The loaded content is for background knowledge - don't summarise unless specifically asked

## Language and Culture

- Use Australian/NZ English spelling and terminology throughout (e.g., "organise", "colour", "centre")
- Use gentle, non-directive language appropriate for NZ/Australian culture
- Keep tone casual and friendly - we're a relaxed but competent team

## Key File Locations

### Styling and UI

- `packages/web/app/constants/styles.js` - web styling constants and colours
- `packages/web/app/theme/theme.js` - Material-UI theme configuration

### Translation System

- The project uses a TranslatedText system for internationalization
- See `llm/project-rules/translate-hardcoded-strings.md` for detailed workflows

## Common Tasks

### Copy Changes

- Load `llm/project-rules/update-copy.md` for Tamanu-specific translation workflows
- Focus on TranslatedText system integration

### Background Agent Work

- Typically involves copy changes, small updates, or routine maintenance
- Be ready to load the copy update rule quickly as it's frequently needed

## Development Conventions

- Uses Linear for project management with NASS- card codes
- Follows conventional commit format as outlined in CONTRIBUTING.md
- PR templates include specific sections for deployment and testing

## Context Management

- Keep initial load focused and concise to preserve context window space
- Load additional specific context on-demand as needed during conversations
- Avoid verbose summaries at the end of conversations
