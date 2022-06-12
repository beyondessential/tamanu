import React, { useState, useCallback } from 'react';
import styled from 'styled-components';
import Button from '@material-ui/core/Button';
import ButtonGroup from '@material-ui/core/ButtonGroup';
import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown';
import ClickAwayListener from '@material-ui/core/ClickAwayListener';
import MuiPaper from '@material-ui/core/Paper';
import MenuItem from '@material-ui/core/MenuItem';
import MuiMenuList from '@material-ui/core/MenuList';
import { Colors } from '../constants';

const Container = styled.div`
  position: relative;
  display: inline-block;
`;

const Paper = styled(MuiPaper)`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 2px;
`;

const MenuList = styled(MuiMenuList)`
  margin: 2px 0;
  padding: 0;

  .MuiListItem-root {
    padding: 6px 6px 6px 12px;
    font-size: 12px;
    line-height: 15px;
    white-space: initial;

    &:hover {
      background: ${Colors.background};
    }
  }
`;

const MainButton = styled(Button)`
  flex: 1;
  border-radius: 3px;
  text-transform: capitalize;
  font-size: 14px;
  line-height: 18px;
  padding: 8px 13px;
  letter-spacing: 0;

  &.MuiButtonBase-root.MuiButton-root {
    box-shadow: none;
    border: none;
  }
`;

const MenuButton = styled(Button)`
  padding: 8px 8px 8px 0;
  border-radius: 3px;

  .MuiButton-label {
    border-left: 1px solid white;
  }

  .MuiSvgIcon-root {
    width: 28px;
    height: auto;
    padding-left: 6px;
  }
`;

export const DropdownButton = React.memo(({ actions, ...props }) => {
  const [open, setOpen] = useState(false);

  function handleClick(event, index) {
    setOpen(false);
    actions[index].onClick(event);
  }

  const handleToggle = useCallback(event => {
    event.stopPropagation();
    setOpen(prev => !prev);
  }, []);

  const handleClose = useCallback(() => {
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
    <Container>
      <ButtonGroup
        variant="contained"
        color="primary"
        disableElevation
        style={{ width: '100%' }}
        {...props}
      >
        <MainButton onClick={event => handleClick(event, 0)}>{mainAction.label}</MainButton>
        <MenuButton onClick={handleToggle}>
          <KeyboardArrowDownIcon />
        </MenuButton>
      </ButtonGroup>
      {open && (
        <Paper elevation={0} variant="outlined">
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
      )}
    </Container>
  );
});
