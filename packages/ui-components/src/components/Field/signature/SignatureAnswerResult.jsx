import React from 'react';
import styled from 'styled-components';
import { SignaturePathDisplay } from './SignaturePathDisplay';

const Svg = styled(SignaturePathDisplay)`
  background-color: ${p => p.theme.palette.background.default};
  border-radius: ${p => p.theme.shape.borderRadius}px;
  border: 1px solid ${p => p.theme.palette.divider};
`;

export function SignatureAnswerResult({ answer, ...props }) {
  return <Svg data-testid="signatureanswerresult" path={answer} {...props} />;
}
