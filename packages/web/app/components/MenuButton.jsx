import React, { useRef, useState } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { ClickAwayListener, IconButton, MenuItem, MenuList, Paper, Popper } from '@mui/material';
import { Colors } from '../constants';

const OpenButton = styled(IconButton)`
  padding: 5px;
`;

const Item = styled(MenuItem)`
  font-weight: 400;
  font-size: 12px;
  line-height: 15px;

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
  ({
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
          <Icon style={{ color: iconColor, cursor: 'pointer' }} data-testid="icon-p0po" />
        </OpenButton>
        <Popper
          open={open}
          anchorEl={anchorRef.current}
          transition
          disablePortal
          placement={placement}
          style={{ zIndex: 10 }}
          data-testid="popper-0e9z"
        >
          {() => (
            <Paper id="menu-list-grow" variant="outlined" data-testid="paper-f59g">
              <ClickAwayListener onClickAway={handleClose} data-testid="clickawaylistener-dxm1">
                <List data-testid="list-i0ae">
                  {actions.filter(Boolean).map(({ action, label, wrapper }, index) => {
                    const menuItem = (
                      <Item
                        disabled={!action}
                        key={label.props.fallback}
                        onClick={event => handleClick(event, action)}
                        data-testid={`item-8ybn-${index}`}
                      >
                        {label}
                      </Item>
                    );
                    return wrapper ? wrapper(menuItem) : menuItem;
                  })}
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
