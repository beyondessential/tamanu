import MoreVert from '@mui/icons-material/MoreVert';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import React, { useId, useState } from 'react';
import styled from 'styled-components';

const StyledMenu = styled(Menu).attrs({
  'data-testid': 'styledmenu-7k45',
  anchorOrigin: { vertical: 'bottom', horizontal: 'right' },
  getContentAnchorEl: null,
  transformOrigin: { vertical: 'top', horizontal: 'right' },
})`
  & .MuiList-padding {
    padding-block: 4px;
  }
`;

const StyledIconButton = styled(IconButton)`
  margin-left: auto;
  padding: 7px;
`;

export const ThreeDotMenu = ({ items, disabled, className }) => {
  const menuId = useId();
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
      <StyledIconButton
        aria-controls={menuId}
        aria-expanded={open}
        aria-haspopup="menu"
        className={className}
        data-testid="stylediconbutton-szh8"
        disabled={disabled}
        onClick={onOpenKebabMenu}
      >
        <MoreVert />
      </StyledIconButton>
      <StyledMenu anchorEl={anchorEl} id={menuId} onClose={handleCloseKebabMenu} open={open}>
        {items.map(
          (item, index) =>
            !item.hidden && (
              <MenuItem
                key={index}
                onClick={() => handleAction(item)}
                disabled={item.disabled}
                data-testid={`menuitem-${index}`}
              >
                {item.label}
              </MenuItem>
            ),
        )}
      </StyledMenu>
    </>
  );
};
