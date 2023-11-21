import React from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import { Grid, Typography } from '@material-ui/core';
import { yellow } from '@material-ui/core/colors';
import { MUI_SPACING_UNIT as spacing } from '../constants';

export const NotificationContainer = styled(Grid)`
  padding: ${spacing * 2}px ${spacing * 3}px;
  background-color: ${yellow[50]};
  margin-bottom: ${spacing}px !important;
`;

export const Notification = ({ message }) => (
  <NotificationContainer container item>
    <Typography variant="body1">{message}</Typography>
  </NotificationContainer>
);

Notification.propTypes = {
  message: PropTypes.node.isRequired,
};
