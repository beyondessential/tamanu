import React from 'react';
import { IconButton, Icon } from '@material-ui/core';
import { AddBoxOutlined, IndeterminateCheckBox, Autorenew } from '@material-ui/icons';

const MuiIconButton = ({ primary, ...props }) => <IconButton {...props} />;

export const SyncIconButton = ({ ...props }) => (
  <MuiIconButton color="primary" {...props}>
    <Icon className="fa fa-cloud-download" fontSize="small" />
  </MuiIconButton>
);

export const UndoIconButton = ({ ...props }) => (
  <MuiIconButton color="primary" {...props}>
    <Icon className="fa fa-undo" fontSize="inherit" />
  </MuiIconButton>
);

export const TickIconButton = ({ ...props }) => (
  <MuiIconButton color="primary" {...props}>
    <Icon className="fa fa-check" fontSize="inherit" />
  </MuiIconButton>
);

export const PlusIconButton = ({ ...props }) => (
  <MuiIconButton color="primary" {...props}>
    <AddBoxOutlined fontSize="inherit" />
  </MuiIconButton>
);

export const MinusIconButton = ({ ...props }) => (
  <MuiIconButton color="primary" {...props}>
    <IndeterminateCheckBox fontSize="inherit" />
  </MuiIconButton>
);

export const AutorenewIconButton = ({ ...props }) => (
  <MuiIconButton color="primary" {...props}>
    <Autorenew fontSize="inherit" />
  </MuiIconButton>
);
