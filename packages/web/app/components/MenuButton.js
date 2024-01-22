import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import MoreHorizIcon from '@material-ui/icons/MoreHoriz';
import {
  MenuList,
  MenuItem,
  Popper,
  Paper,
  ClickAwayListener,
  IconButton,
} from '@material-ui/core';
import { Colors } from '../constants';

const OpenButton = styled(IconButton)`
  padding: 5px;
`;

const Item = styled(MenuItem)`
  font-weight: 400;
  font-size: 12px;
  line-height: 15px;
  min-width: 110px;

  &:hover {
    background: ${Colors.veryLightBlue};
  }
`;

const List = styled(MenuList)`
  padding: 3px;
  border-radius: 3px;

  .MuiListItem-root {
    padding: 4px;
  }
`;

export const MenuButton = React.memo(
  ({ actions, className, iconDirection, iconColor, disabled = false }) => {
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
        <OpenButton disabled={disabled} onClick={handleToggle} ref={anchorRef}>
          <Icon style={{ color: iconColor, cursor: 'pointer' }} />
        </OpenButton>
        <Popper
          open={open}
          anchorEl={anchorRef.current}
          transition
          disablePortal
          placement="bottom-end"
          style={{ zIndex: 10 }}
        >
          {() => (
            <Paper id="menu-list-grow" variant="outlined">
              <ClickAwayListener onClickAway={handleClose}>
                <List>
                  {actions.map(({ label, action }) => (
                    <Item
                      key={label}
                      disabled={!action}
                      onClick={event => handleClick(event, action)}
                    >
                      {label}
                    </Item>
                  ))}
                </List>
              </ClickAwayListener>
            </Paper>
          )}
        </Popper>
      </div>
    );
  },
);

MenuButton.propTypes = {
  actions: PropTypes.objectOf(PropTypes.func).isRequired,
  iconDirection: PropTypes.string,
  iconColor: PropTypes.string,
};

MenuButton.defaultProps = {
  iconDirection: 'vertical',
  iconColor: Colors.midText,
};
