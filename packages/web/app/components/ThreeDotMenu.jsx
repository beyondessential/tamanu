import React, { useState } from 'react';
import styled from 'styled-components';
import { IconButton, Menu, MenuItem } from '@material-ui/core';
import { MoreVert } from '@material-ui/icons';
import { Colors } from '../constants';

const ThreeDotMenuItem = styled(MenuItem)`
  width: 124px;
  font-size: 11px;
  line-height: 15px;
  border-radius: 4px;
  padding: 4px;
  margin-left: 4px;
  margin-right: 4px;
  white-space: normal;
  ${props => (props.$color ? `color: ${props.$color};` : '')} :hover {
    background: ${Colors.veryLightBlue};
  }
`;

const StyledMenu = styled(Menu)`
  & .MuiList-padding {
    padding-top: 4px;
    padding-bottom: 4px;
  }
`;

const StyledIconButton = styled(IconButton)`
  margin-left: auto;
  padding: 7px;
`;

export const ThreeDotMenu = ({ items }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const onOpenKebabMenu = event => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseKebabMenu = () => {
    setAnchorEl(null);
  };

  const handleAction = item => {
    item.onClick?.();
    handleCloseKebabMenu();
  };

  return (
    <>
      <StyledIconButton onClick={onOpenKebabMenu}>
        <MoreVert />
      </StyledIconButton>
      <StyledMenu
        anchorEl={anchorEl}
        getContentAnchorEl={null}
        open={open}
        onClose={handleCloseKebabMenu}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        {items.map((item, index) => (
          <ThreeDotMenuItem key={index} onClick={() => handleAction(item)} disabled={item.disabled}>
            {item.label}
          </ThreeDotMenuItem>
        ))}
      </StyledMenu>
    </>
  );
};
