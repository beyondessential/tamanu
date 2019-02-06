import React from 'react';
import IconButton from '@material-ui/core/IconButton';
import Icon from '@material-ui/core/Icon';


const MuiIconButton = ({ primary, ...props }) => {
  return <IconButton
    { ...props }
  />;
};

export const SyncIconButton = ({ ...props }) => {
  return <MuiIconButton
    color="primary"
    { ...props }
  >
    <Icon className="fa fa-cloud-download" fontSize="small" />
  </MuiIconButton>;
};
