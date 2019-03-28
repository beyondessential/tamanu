import React from 'react';
import styled from 'styled-components';
import { Grid, Paper } from '@material-ui/core';
import { PropTypes } from 'prop-types';
import { MUI_SPACING_UNIT as spacing } from '../constants';

// workaround for https://github.com/styled-components/styled-components/issues/1198
const ContainerChild = styled(Paper)`
  padding:  ${props => (props.nopadding ? 0 : `${spacing * 2}px ${spacing * 3}px`)};
  box-shadow: none !important;
  min-height: ${props => (props.autoheight ? 'auto' : 'calc(100vh - 70px)')};
`;

export const Container = ({ autoHeight, noPadding, ...props }) => (
  <ContainerChild
    autoheight={autoHeight ? 1 : 0}
    nopadding={noPadding ? 1 : 0}
    {...props}
  />
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
  button:first-child, a:first-child {
    margin-left: 0;
  }
  > button, a {
    margin-left: ${spacing / 2}px;
  }
`;

export function FormRow({ children }) {
  return (
    <Grid container item spacing={32}>
      {React.Children.map(children, (child, key) => {
        if (React.isValidElement(child)) {
          return (
            <Grid item xs key={key}>
              {child}
            </Grid>
          );
        }
        return (null);
      })}
    </Grid>
  );
}

FormRow.propTypes = {
  children: PropTypes.node.isRequired,
};
