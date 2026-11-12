import React from 'react';
import { describe, it, expect } from 'vitest';

import { linkifyUrls } from '../../../../app/views/administration/settings/linkifyUrls';

const partsOf = text => {
  const result = linkifyUrls(text);
  return Array.isArray(result) ? result : [result];
};

const hrefsIn = text =>
  partsOf(text)
    .filter(part => React.isValidElement(part))
    .map(part => part.props.href);

// the rendered text a reader ends up with, links included
const textOf = text =>
  partsOf(text)
    .map(part => (React.isValidElement(part) ? part.props.children : part))
    .join('');

describe('linkifyUrls', () => {
  it('leaves text with no URL as a plain string', () => {
    expect(linkifyUrls('Settings for AI-powered features')).toBe(
      'Settings for AI-powered features',
    );
  });

  it('passes through a value that is not a string', () => {
    expect(linkifyUrls(undefined)).toBe(undefined);
    expect(linkifyUrls(null)).toBe(null);
  });

  it('links a URL and keeps the words around it', () => {
    const banner = 'Model IDs are listed at https://platform.claude.com/docs for reference';

    expect(hrefsIn(banner)).toEqual(['https://platform.claude.com/docs']);
    expect(textOf(banner)).toBe(banner);
  });

  it('links a URL that ends the text', () => {
    const banner = 'See https://platform.claude.com/docs';

    expect(hrefsIn(banner)).toEqual(['https://platform.claude.com/docs']);
    expect(textOf(banner)).toBe(banner);
  });

  it('links every URL in the text', () => {
    const banner = 'Either https://one.example or http://two.example works';

    expect(hrefsIn(banner)).toEqual(['https://one.example', 'http://two.example']);
    expect(textOf(banner)).toBe(banner);
  });

  it('opens links in a new tab without handing over the opener', () => {
    const [link] = partsOf('See https://platform.claude.com/docs').filter(part =>
      React.isValidElement(part),
    );

    expect(link.props.target).toBe('_blank');
    expect(link.props.rel).toBe('noreferrer');
  });
});
