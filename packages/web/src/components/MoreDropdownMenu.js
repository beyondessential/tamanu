import React, { useCallback } from 'react';
import ClickAwayListener from '@material-ui/core/ClickAwayListener';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import MoreHorizIcon from '@material-ui/icons/MoreHoriz';
import Paper from '@material-ui/core/Paper';
import Popper from '@material-ui/core/Popper';
import MenuItem from '@material-ui/core/MenuItem';
import MenuList from '@material-ui/core/MenuList';

export const MoreDropdownMenu = ({ actions, className, iconDirection = 'vertical', iconColor }) => {
  const [open, setOpen] = React.useState(false);
  const anchorRef = React.useRef(null);
  function handleClick(event, index) {
    setOpen(false);
    actions[index].onClick(event);
  }

  const handleToggle = useCallback(() => {
    setOpen(prevOpen => !prevOpen);
  }, []);

  const handleClose = useCallback(event => {
    if (anchorRef.current && anchorRef.current.contains(event.target)) {
      return;
    }

    setOpen(false);
  }, []);

  if (!actions.length) {
    return null;
  }

  const Icon = iconDirection === 'vertical' ? MoreVertIcon : MoreHorizIcon;

  return (
    <span className={className} ref={anchorRef}>
      <Icon
        style={{ color: iconColor, cursor: 'pointer' }}
        aria-haspopup="true"
        onClick={handleToggle}
      />
      <Popper
        open={open}
        anchorEl={anchorRef.current}
        transition
        disablePortal
        placement="bottom-end"
      >
        {() => (
          <Paper id="menu-list-grow">
            <ClickAwayListener onClickAway={handleClose}>
              <MenuList>
                {actions.map((action, index) => (
                  <MenuItem
                    key={action.label}
                    disabled={!action.onClick}
                    onClick={event => handleClick(event, index)}
                  >
                    {action.label}
                  </MenuItem>
                ))}
              </MenuList>
            </ClickAwayListener>
          </Paper>
        )}
      </Popper>
    </span>
  );
};
