import { IconButton, Menu, MenuItem } from '@material-ui/core';
import { MoreVert } from '@material-ui/icons';
import React, { useState } from 'react';
import styled from 'styled-components';

import { useTranslation } from '@tamanu/ui-components';
import { Colors } from '../constants';

const ThreeDotMenuItem = styled(MenuItem)`
  font-size: 11px;
  line-height: 15px;
  border-radius: 4px;
  padding: 4px;
  margin-left: 4px;
  margin-right: 4px;
  white-space: normal;

  :hover {
    background: ${Colors.veryLightBlue};
  }
`;

const StyledMenu = styled(Menu)`
  & .MuiList-padding {
    padding-block: 4px;
  }
`;

const StyledIconButton = styled(IconButton)`
  margin-inline-start: auto;
  padding: 7px;
`;

export const ThreeDotMenu = ({ items, disabled, className }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const { getTranslation } = useTranslation();

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
        aria-label={getTranslation('general.more', 'More')}
        onClick={onOpenKebabMenu}
        disabled={disabled}
        className={className}
        data-testid="stylediconbutton-szh8"
      >
        <MoreVert aria-hidden data-testid="morevert-kusc" />
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
        data-testid="styledmenu-7k45"
      >
        {items
          .filter(item => !item.hidden)
          .map((item, index) => (
            <ThreeDotMenuItem
              key={item.key ?? index}
              onClick={() => handleAction(item)}
              disabled={item.disabled}
              data-testid={`menuitem-${index}`}
            >
              {item.label}
            </ThreeDotMenuItem>
          ))}
      </StyledMenu>
    </>
  );
};
