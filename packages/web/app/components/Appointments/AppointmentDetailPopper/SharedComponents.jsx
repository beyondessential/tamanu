import { styled } from '@mui/material/styles';
import React from 'react';

const FlexCol = styled('div')`
  display: flex;
  flex-direction: column;
`;

const H3 = styled('h3')`
  font-size: inherit;
  font-weight: 500;
  letter-spacing: 0.015em;
  margin-block: 0;
`;

const Paragraph = styled('p')`
  letter-spacing: 0.01em;
  margin-block: 0;
`;

const InlineParagraph = styled(Paragraph)`
  display: inline-block;
`;

export const InlineDetailsDisplay = ({ label, value }) => (
  <InlineParagraph data-testid='inlineparagraph-x9p1'>
    <strong>{label}: </strong> {value || <>&mdash;</>}
  </InlineParagraph>
);

export const DetailsDisplay = ({ label, value }) => {
  return (
    <FlexCol data-testid='flexcol-6ptz'>
      <H3 data-testid='h3-bec8'>{label}</H3>
      <Paragraph data-testid='paragraph-k583'>{value || <>&mdash;</>}</Paragraph>
    </FlexCol>
  );
};
