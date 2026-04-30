import React from 'react';
import { Typography } from '@material-ui/core';
import styled from 'styled-components';

const ContentUnavailableViewRoot = styled.div`
  margin-trim: block;
  padding-block: 1.5rem;
  text-align: center;
  text-wrap: balance;
  svg,
  .lucide {
    color: ${props => props.theme.palette.text.tertiary};
    font-size: 3.375rem;
    height: 3.375rem;
    width: auto;
  }
`;

const Heading = styled(Typography).attrs({
  variant: 'h2',
})`
  font-size: 1.5rem;
  font-weight: 500;
  margin-block-start: 0.5em;
`;

const Description = styled(Typography).attrs({
  variant: 'body2',
})`
  color: ${props => props.theme.palette.text.secondary};
  margin-block-start: 0.5em;
`;

export function ContentUnavailableView({ icon, heading, description, ...props }) {
  return (
    <ContentUnavailableViewRoot {...props}>
      {icon}
      <Heading>{heading}</Heading>
      <Description>{description}</Description>
    </ContentUnavailableViewRoot>
  );
}
