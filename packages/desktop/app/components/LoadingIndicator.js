import React from 'react';
import styled from 'styled-components';
import CircularProgress from '@material-ui/core/CircularProgress';

const LoadingIconContainer = styled.div`
  display: grid;
  width: 100%;
  height: 100vh;
  background: ${props => props.backgroundColor || '#cecece'};
  opacity: 0.5;
  overflow: hidden;
  z-index: 9999;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);

  div {
    grid-column: 2;
    grid-row: 2;
    justify-self: center;
    align-self: center;
  }
`;

export const LoadingIndicator = React.memo(({ backgroundColor }) => (
  <LoadingIconContainer backgroundColor={backgroundColor}>
    <CircularProgress size="5rem" />
  </LoadingIconContainer>
));
