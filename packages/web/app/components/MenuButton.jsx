import { IconButton, MenuItem, MenuList, Paper, Popper } from '@material-ui/core';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import PropTypes from 'prop-types';
import React, { useRef, useState } from 'react';
import styled from 'styled-components';

import { VisuallyHidden } from '@tamanu/ui-components';
import { Colors } from '../constants';

const OpenButton = styled(IconButton)`
  padding: 5px;
`;

const List = styled(MenuList)`
  padding: 3px;
  border-radius: 3px;
`;

export const MenuButton = React.memo(
  ({
    a11yLabel,
    actions,
    className,
    iconDirection,
    iconColor,
    disabled = false,
    placement = 'bottom-end',
  }) => {
    const [open, setOpen] = useState(false);
    const anchorRef = useRef(null);

    const handleClick = (event, action) => {
      setOpen(false);
      action(event);
    };

    const handleToggle = () => {
      setOpen(prevOpen => !prevOpen);
    };

    const handleClose = event => {
      if (anchorRef.current && anchorRef.current.contains(event.target)) {
        return;
      }
      setOpen(false);
    };

    const Icon = iconDirection === 'vertical' ? MoreVertIcon : MoreHorizIcon;

    return (
      <div className={className}>
        <OpenButton
          disabled={disabled}
          onClick={handleToggle}
          ref={anchorRef}
          data-testid="openbutton-d1ec"
        >
          <Icon style={{ color: iconColor }} data-testid="icon-p0po" />
          {a11yLabel && <VisuallyHidden>{a11yLabel}</VisuallyHidden>}
        </OpenButton>
        <Popper
          open={open}
          anchorEl={anchorRef.current}
          transition
          placement={placement}
          data-testid="popper-0e9z"
        >
          <Paper id="menu-list-grow" variant="outlined" data-testid="paper-f59g">
            <ClickAwayListener mouseEvent="onMouseDown" onClickAway={handleClose}>
              <List data-testid="list-i0ae">
                {actions.filter(Boolean).map(({ action, label, wrapper }, index) => {
                  const menuItem = (
                    <MenuItem
                      disabled={!action}
                      key={label.props.fallback}
                      onClick={event => handleClick(event, action)}
                      data-testid={`item-8ybn-${index}`}
                    >
                      {label}
                    </MenuItem>
                  );
                  return wrapper ? wrapper(menuItem) : menuItem;
                })}
              </List>
            </ClickAwayListener>
          </Paper>
        </Popper>
      </div>
    );
  },
);

MenuButton.propTypes = {
  a11yLabel: PropTypes.node,
  actions: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.node.isRequired,
      action: PropTypes.func.isRequired,
    }),
  ).isRequired,
  iconDirection: PropTypes.string,
  iconColor: PropTypes.string,
};

MenuButton.defaultProps = {
  iconDirection: 'vertical',
  iconColor: Colors.midText,
};
