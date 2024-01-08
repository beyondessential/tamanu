import React from 'react';
import { Grid, Fade } from '@material-ui/core';
import styled from 'styled-components';
import preloaderSrc from '../assets/images/preloader.svg';

const FullScreenContainer = styled(Grid)`
  height: 100vh;
  position: absolute;
  top: 0;
  left: 0;
  background-color: rgba(0, 0, 0, 0.3);
`;

export const Preloader = () => (
  <Fade in timeout={{ enter: 500, exit: 200 }}>
    <FullScreenContainer justify="center" alignItems="center" container item>
      <img width="80" src={preloaderSrc} alt="Loading..." />
    </FullScreenContainer>
  </Fade>
);
