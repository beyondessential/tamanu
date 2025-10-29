import React, { useRef, useState } from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown';
import {
  ButtonGroup,
  ClickAwayListener,
  MenuItem,
  Button as MuiButton,
  MenuList as MuiMenuList,
  Popper as MuiPopper,
  Paper,
} from '@material-ui/core';
import LockIcon from '@material-ui/icons/Lock';

import { Button, FormSubmitButton } from '@tamanu/ui-components';
import { Colors } from '../constants/styles';

import { withPermissionCheck } from './withPermissionCheck';
import { withPermissionTooltip } from './withPermissionTooltip';

const Container = styled.div`
  position: relative;
  display: inline-block;
`;

const mainButtonStyles = `
  border-radius: 3px;
  text-transform: none;
  font-size: 14px;
  line-height: 18px;
  padding: 8px 13px;
  letter-spacing: 0;

  &.MuiButton-sizeLarge {
    padding: 10px 19px;
  }

  &.MuiButton-sizeSmall {
    padding: 7px 10px 7px 10px;
    line-height: 16px;
  }

  &.MuiButton-outlinedPrimary {
    border-color: ${(props) => props.theme.palette.primary.main};
    border-right-color: transparent;
  }

  &.MuiButton-containedPrimary {
    border-color: transparent;
  }

  &.MuiButtonGroup-groupedContainedHorizontal:not(:last-child).Mui-disabled {
    border-right: none;
  }

  .MuiSvgIcon-root {
    width: 19.5px;
    height: auto;
    margin-left: 5px;
    margin-right: 10px;
  }
`;
const FormMainButton = styled(FormSubmitButton)`
  ${mainButtonStyles}
`;

const MainButton = styled(Button)`
  ${mainButtonStyles}
`;

const MenuButton = styled(MuiButton)`
  padding: 9px 7px 9px 0;
  border-radius: 3px;

  &.MuiButton-sizeLarge {
    padding: 10px 10px 10px 0;
  }

  &.MuiButton-sizeSmall {
    padding: 6px 8px 6px 0;
  }

  &.MuiButton-outlinedPrimary {
    border-color: ${(props) => props.theme.palette.primary.main};
    border-left: none;

    .MuiButton-label {
      border-left: 1px solid ${(props) => props.theme.palette.primary.main};
    }
  }

  &.MuiButton-containedPrimary {
    .MuiButton-label {
      border-left: 1px solid white;
    }
  }

  .MuiSvgIcon-root {
    width: 28px;
    height: auto;
    padding-left: 6px;
  }
`;

const Popper = styled(MuiPopper)`
  margin-top: 2px;
  z-index: 1500; // This needs to be higher than the modal z-index (1300) to be visible in modals
  min-width: ${(props) => (props.anchorEl ? `${props.anchorEl.offsetWidth}px` : `${0}`)};
`;

const MenuList = styled(MuiMenuList)`
  margin: 2px 0;
  padding: 0;

  .MuiListItem-root {
    padding: 6px 6px 6px 12px;
    font-size: 14px;
    line-height: 1.4;
    white-space: initial;

    &:hover {
      background: ${Colors.background};
    }
  }
`;

export const DropdownButton = React.memo(
  ({
    variant,
    size,
    actions,
    style,
    className,
    disabled = false,
    hasPermission = true,
    MainButtonComponent = MainButton,
  }) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const anchorRef = useRef(null);

    const handleClick = (event, index) => {
      actions[index].onClick(event);
      setAnchorEl(null);
    };

    const handleToggle = () => {
      setAnchorEl(anchorEl ? null : anchorRef.current);
    };

    const handleClose = () => {
      setAnchorEl(null);
    };

    const [mainAction, ...otherActions] = actions;

    if (otherActions.length === 0) {
      return (
        <MainButtonComponent
          variant={variant}
          size={size}
          color="primary"
          disableElevation
          disabled={disabled}
          style={{ borderColor: Colors.primary }}
          onClick={(event) => handleClick(event, 0)}
          data-testid="mainbuttoncomponent-xdka"
        >
          {!hasPermission && <LockIcon data-testid="lockicon-5h0e" />}
          {mainAction.label}
        </MainButtonComponent>
      );
    }

    const isOpen = anchorEl && !disabled && hasPermission;

    return (
      <Container style={style} className={className} ref={anchorRef} data-testid="container-v3a1">
        <ButtonGroup
          variant={variant}
          size={size}
          color="primary"
          disableElevation
          style={{ width: '100%' }}
          disabled={disabled || !hasPermission}
          data-testid="buttongroup-ym83"
        >
          <MainButtonComponent
            onClick={(event) => handleClick(event, 0)}
            data-testid="mainbuttoncomponent-06gp"
          >
            {!hasPermission && <LockIcon data-testid="lockicon-mdm4" />}
            {mainAction.label}
          </MainButtonComponent>
          <MenuButton onClick={handleToggle} data-testid="menubutton-dc8o">
            <KeyboardArrowDownIcon data-testid="keyboardarrowdownicon-8dwd" />
          </MenuButton>
        </ButtonGroup>
        <Popper
          open={isOpen ?? false}
          anchorEl={anchorEl}
          placement="bottom-start"
          data-testid="popper-zc8s"
        >
          <Paper elevation={0} variant="outlined" data-testid="paper-0i9j">
            <ClickAwayListener onClickAway={handleClose} data-testid="clickawaylistener-b7hr">
              <MenuList data-testid="menulist-sze7">
                {otherActions.map((action, index) => (
                  <MenuItem
                    key={action.label}
                    disabled={!action.onClick}
                    onClick={(event) => handleClick(event, index + 1)}
                    data-testid={`menuitem-0qdd-${index}`}
                  >
                    {action.label}
                  </MenuItem>
                ))}
              </MenuList>
            </ClickAwayListener>
          </Paper>
        </Popper>
      </Container>
    );
  },
);

export const FormSubmitDropdownButton = ({ ...props }) => {
  return (
    <DropdownButton
      MainButtonComponent={FormMainButton}
      {...props}
      data-testid="dropdownbutton-chfi"
    />
  );
};

DropdownButton.propTypes = {
  actions: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.node,
      onClick: PropTypes.func,
    }),
  ).isRequired,
  variant: PropTypes.string,
  size: PropTypes.string,
};

DropdownButton.defaultProps = {
  variant: 'contained',
  size: 'medium',
};

const DropdownButtonWithPermissionTooltip = withPermissionTooltip(DropdownButton);
export const DropdownButtonWithPermissionCheck = withPermissionCheck(
  DropdownButtonWithPermissionTooltip,
);
