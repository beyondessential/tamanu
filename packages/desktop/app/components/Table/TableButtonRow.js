import React from 'react';
import styled from 'styled-components';
import { PropTypes } from 'prop-types';

const Row = styled.div`
  display: flex;
  align-items: center;
  justify-content: ${props => `${props.$justifyContent || 'flex-end'};`};
  margin-bottom: ${props => (props.$variant === 'small' ? ' 18px' : '36px')};

  button {
    margin-left: ${props => (props.$variant === 'small' ? ' 10px' : '16px')};
  }
`;

export const TableButtonRow = ({ children, variant, justifyContent }) => (
  <Row $variant={variant} $justifyContent={justifyContent}>
    {children}
  </Row>
);

TableButtonRow.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.string,
  justifyContent: PropTypes.string,
};

TableButtonRow.defaultProps = {
  variant: null,
  justifyContent: null,
};
