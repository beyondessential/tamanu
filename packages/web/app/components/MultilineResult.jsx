import React from 'react';
import styled from 'styled-components';

const Pre = styled.pre`
  font-family: inherit;
  text-wrap-mode: initial;
  white-space-collapse: preserve;
`;

/** @param {React.ComponentPropsWithRef<typeof Pre> & { answer: string }} props */
export default function MultilineResult({ answer, ...props }) {
  return <Pre {...props}>{answer}</Pre>;
}
