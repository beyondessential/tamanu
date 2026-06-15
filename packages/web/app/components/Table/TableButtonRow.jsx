import React from 'react';
import styled from 'styled-components';
import { PropTypes } from 'prop-types';

const Row = styled.div`
  align-items: center;
  display: flex;
  gap: ${props => (props.$variant === 'small' ? ' 10px' : '16px')};
  justify-content: ${props => `${props.$justifyContent || 'flex-end'};`};
  margin-block-end: ${props => (props.$variant === 'small' ? ' 18px' : '36px')};
`;

export const TableButtonRow = ({ children, variant, justifyContent }) => (
  <Row $variant={variant} $justifyContent={justifyContent} data-testid="row-v55c">
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
