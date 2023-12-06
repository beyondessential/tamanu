import sanitizeHtml from 'sanitize-html';

export const sanitise = dirty => sanitizeHtml(dirty, { allowedTags: [], allowedAttributes: {} });
