import React from 'react';
import styled from 'styled-components';
import { Grid, Paper, Typography } from '@material-ui/core';
import { grey } from '@material-ui/core/colors';
import { PropTypes } from 'prop-types';
import { MUI_SPACING_UNIT as spacing } from '../constants';

// workaround for https://github.com/styled-components/styled-components/issues/1198
const ContainerChild = styled(Paper)`
  padding: ${props => (props.nopadding ? 0 : `${spacing * 2}px ${spacing * 3}px`)};
  box-shadow: none !important;
  min-height: ${props => (props.autoheight ? 'auto' : 'calc(100vh - 70px)')};
  flex-grow: 1;
`;

export const Container = ({ autoHeight, noPadding, ...props }) => (
  <ContainerChild autoheight={autoHeight ? 1 : 0} nopadding={noPadding ? 1 : 0} {...props} />
);

Container.propTypes = {
  autoHeight: PropTypes.bool,
  noPadding: PropTypes.bool,
};

Container.defaultProps = {
  autoHeight: false,
  noPadding: false,
};

export const TabHeader = ({ children }) => (
  <Grid container spacing={spacing} style={{ marginBottom: spacing }}>
    <Grid item xs />
    <Grid item>{children}</Grid>
  </Grid>
);

TabHeader.propTypes = {
  children: PropTypes.node.isRequired,
};

export const ButtonGroup = styled.div`
  button:first-child,
  a:first-child {
    margin-left: 0;
  }
  > button,
  a {
    margin-left: ${spacing / 2}px;
  }
`;

export const BottomBar = ({ children }) => (
  <Grid container item justify="flex-end" style={{ marginTop: spacing * 3 }}>
    <ButtonGroup>{children}</ButtonGroup>
  </Grid>
);

BottomBar.propTypes = {
  children: PropTypes.node.isRequired,
};

export const SubHeader = ({ title, children }) => (
  <Grid
    container
    style={{
      marginBottom: spacing,
      marginTop: spacing * 2,
      backgroundColor: grey[200],
      padding: spacing,
    }}
  >
    <Grid item xs>
      <Typography variant="h6">{title}</Typography>
    </Grid>
    {children && (
      <Grid container item xs justify="flex-end">
        {children}
      </Grid>
    )}
  </Grid>
);

SubHeader.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node,
};

SubHeader.defaultProps = {
  children: null,
};
