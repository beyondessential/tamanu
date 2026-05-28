import React from 'react';
import styled from 'styled-components';
import { TAMANU_COLORS } from '../constants';

const ContentUnavailableViewRoot = styled.div`
  margin-trim: block;
  padding-block: 1.5rem;
  padding-inline: 2rem;
  text-align: center;
  text-wrap: balance;
  svg,
  .lucide {
    color: ${TAMANU_COLORS.softText};
    font-size: 3.375rem;
    height: 3.375rem;
    width: auto;
  }
`;

const Heading = styled.h2`
  font: inherit;
  font-size: 1.5em;
  font-weight: 500;
  margin-block: 0.5rem 0;
`;

const Description = styled.p`
  font: inherit;
  color: ${props => props.theme.palette.text.secondary};
  margin-block: 0.5rem 0;
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
