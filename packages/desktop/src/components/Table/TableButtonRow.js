import React from 'react';
import styled from 'styled-components';

const Row = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-bottom: ${props => (props.$variant === 'small' ? '24px' : '36px')};

  button {
    margin-left: 16px;
  }
`;

export const TableButtonRow = ({ children, variant }) => <Row $variant={variant}>{children}</Row>;
