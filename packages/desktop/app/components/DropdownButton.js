import React, { useCallback } from 'react';
import styled from 'styled-components';
import Button from '@material-ui/core/Button';
import ButtonGroup from '@material-ui/core/ButtonGroup';
import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown';
import ClickAwayListener from '@material-ui/core/ClickAwayListener';
import Paper from '@material-ui/core/Paper';
import MuiPopper from '@material-ui/core/Popper';
import MenuItem from '@material-ui/core/MenuItem';
import MenuList from '@material-ui/core/MenuList';

const MainButton = styled(Button)`
  text-transform: capitalize;
  font-size: 14px;
  line-height: 18px;
  padding: 8px 13px;
  letter-spacing: 0;

  &.MuiButtonBase-root.MuiButton-root {
    border: none;
  }
`;

const MenuButton = styled(Button)`
  padding: 8px 8px 8px 0;

  .MuiButton-label {
    border-left: 1px solid white;
  }

  .MuiSvgIcon-root {
    width: 28px;
    height: auto;
    padding-left: 6px;
  }
`;

const Popper = styled(MuiPopper)`
  width: 100%;
`;

// mostly cribbed from the mui example at https://material-ui.com/components/buttons/#split-button

export const DropdownButton = React.memo(({ actions, ...props }) => {
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

  const [mainAction, ...otherActions] = actions;

  if (!mainAction) {
    return (
      <MainButton {...props} variant="contained" color="primary" disabled>
        No action
      </MainButton>
    );
  }

  if (otherActions.length === 0) {
    return (
      <MainButton
        {...props}
        variant="contained"
        color="primary"
        onClick={event => handleClick(event, 0)}
      >
        {mainAction.label}
      </MainButton>
    );
  }

  return (
    <div>
      <ButtonGroup
        variant="contained"
        color="primary"
        disableElevation
        ref={anchorRef}
        aria-label="split button"
        {...props}
      >
        <MainButton onClick={event => handleClick(event, 0)}>{mainAction.label}</MainButton>
        <MenuButton onClick={handleToggle}>
          <KeyboardArrowDownIcon />
        </MenuButton>
      </ButtonGroup>
      <Popper
        open={open}
        anchorEl={anchorRef.current}
        transition
        disablePortal
        style={{ zIndex: 10 }}
      >
        <Paper>
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
      </Popper>
    </div>
  );
});
