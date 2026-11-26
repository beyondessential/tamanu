import { escape } from 'es-toolkit/compat';

/**
 * Escapes a value for insertion into a translation that is rendered as HTML
 * (via `dangerouslySetInnerHTML`). The markup belongs to the translation template; every
 * replacement value inserted into it must be escaped.
 */
export const escapeHtml = value => escape(value ?? '');
