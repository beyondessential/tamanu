import React from 'react';
import styled from 'styled-components';
import Button from '@material-ui/core/Button';
import ButtonGroup from '@material-ui/core/ButtonGroup';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import ClickAwayListener from '@material-ui/core/ClickAwayListener';
import Grow from '@material-ui/core/Grow';
import Paper from '@material-ui/core/Paper';
import Popper from '@material-ui/core/Popper';
import MenuItem from '@material-ui/core/MenuItem';
import MenuList from '@material-ui/core/MenuList';

// mostly cribbed from the mui example at https://material-ui.com/components/buttons/#split-button

export const DropdownButton = React.memo(({ actions, color, dropdownColor, ...props }) => {
  const [open, setOpen] = React.useState(false);
  const anchorRef = React.useRef(null);

  function handleClick(event, index) {
    setOpen(false);
    actions[index].onClick(event);
  }

  function handleToggle() {
    setOpen(prevOpen => !prevOpen);
  }

  function handleClose(event) {
    if (anchorRef.current && anchorRef.current.contains(event.target)) {
      return;
    }

    setOpen(false);
  }

  const [mainAction, ...otherActions] = actions;

  if (!mainAction) {
    return (
      <Button {...props} variant="outlined" color={color} disabled>
        No action
      </Button>
    );
  }

  if (otherActions.length === 0) {
    return (
      <Button {...props} variant="outlined" color={color} onClick={event => handleClick(event, 0)}>
        {mainAction.label}
      </Button>
    );
  }

  return (
    <div>
      <ButtonGroup variant="outlined" color={color} ref={anchorRef} aria-label="split button">
        <Button onClick={event => handleClick(event, 0)}>{mainAction.label}</Button>
        <Button
          color={dropdownColor || color}
          size="small"
          aria-owns={open ? 'menu-list-grow' : undefined}
          aria-haspopup="true"
          onClick={handleToggle}
        >
          <ArrowDropDownIcon />
        </Button>
      </ButtonGroup>
      <Popper
        open={open}
        anchorEl={anchorRef.current}
        transition
        disablePortal
        style={{ zIndex: 10 }}
      >
        {({ TransitionProps, placement }) => (
          <Grow
            {...TransitionProps}
            style={{
              transformOrigin: placement === 'bottom' ? 'center top' : 'center bottom',
            }}
          >
            <Paper id="menu-list-grow">
              <ClickAwayListener onClickAway={handleClose}>
                <MenuList>
                  {otherActions.map((action, index) => (
                    <MenuItem
                      key={action.label}
                      disabled={!action.onClick}
                      onClick={event => handleClick(event, index + 1)}
                    >
                      {action.label}
                    </MenuItem>
                  ))}
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </div>
  );
});

export const FullWidthDropdownButton = styled(DropdownButton)`
  width: 100%; /* targets single action button */

  div:first-of-type {
    /* targets dropdown button container, ignoring actions container */
    width: 100%;

    button:first-of-type {
      /* targets action button, ignoring dropdown button */
      width: 100%;
    }
  }
`;
