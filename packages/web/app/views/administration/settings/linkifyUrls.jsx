import React from 'react';
import styled from 'styled-components';

const BannerLink = styled.a`
  color: inherit;
  text-decoration: underline;
`;

// banner text comes from the settings schema, which is a React-free package, so
// a URL arrives as plain text and only becomes a link here
export const linkifyUrls = text => {
  if (typeof text !== 'string') return text;
  const matcher = /https?:\/\/[^\s]+/g;
  const parts = [];
  let last = 0;
  let match;
  while ((match = matcher.exec(text))) {
    parts.push(text.slice(last, match.index));
    parts.push(
      <BannerLink key={match.index} href={match[0]} target="_blank" rel="noreferrer">
        {match[0]}
      </BannerLink>,
    );
    last = match.index + match[0].length;
  }
  if (last === 0) return text;
  parts.push(text.slice(last));
  return parts;
};
