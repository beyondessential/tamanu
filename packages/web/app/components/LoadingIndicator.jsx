import React from 'react';
import styled from 'styled-components';
import CircularProgress from '@material-ui/core/CircularProgress';

const LoadingIconContainer = styled.div`
  display: grid;
  width: ${props => props.width || '100%'};
  height: ${props => props.height || '100vh'};
  background: ${props => props.backgroundColor || '#cecece'};
  opacity: ${props => props.opacity || 0.5};
  overflow: hidden;
  z-index: 1200; // high but below a modal's z-index of 1300
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);

  div {
    grid-column: 2;
    grid-row: 2;
    justify-self: center;
    align-self: center;
  }
`;

export const LoadingIndicator = React.memo(({ backgroundColor, opacity, height, width, size }) => (
  <LoadingIconContainer
    backgroundColor={backgroundColor}
    height={height}
    width={width}
    opacity={opacity}
  >
    <CircularProgress size={size || '5rem'} />
  </LoadingIconContainer>
));
