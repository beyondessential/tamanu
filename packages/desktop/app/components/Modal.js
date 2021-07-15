import React, { memo } from 'react';

import { connect } from 'react-redux';
import { push } from 'connected-react-router';

import styled from 'styled-components';
import MuiDialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogActions from '@material-ui/core/DialogActions';
import PrintIcon from '@material-ui/icons/Print';
import CloseIcon from '@material-ui/icons/Close';
import { IconButton } from '@material-ui/core';
import { getCurrentRoute } from '../store/router';
import { Colors } from '../constants';
import { useElectron } from '../contexts/Electron';
import { Button } from './Button';

const MODAL_PADDING = 32;

/*  To keep consistent use of styled-components,
    re-define dialog paper classes here instead of
    through withStyles(). The global classes for each rule
    can be found in the docs: https://material-ui.com/api/dialog/#css
*/
const Dialog = styled(MuiDialog)`
  .MuiDialog-paperWidthMd {
    max-width: 830px;
  }

  @media print {
    .MuiDialogTitle-root,
    .MuiDialogActions-root {
      display: none;
    }
  }
`;

const ModalContent = styled.div`
  flex: 1 1 auto;
  padding: 18px ${MODAL_PADDING}px;
`;

const ModalContainer = styled.div`
  background: ${Colors.background};
`;

export const FullWidthRow = styled.div`
  margin: 0 -${MODAL_PADDING}px;
  grid-column: 1 / -1;
`;

const ModalTitle = styled(DialogTitle)`
  padding: 14px 14px 14px 32px;

  h2 {
    display: flex;
    justify-content: space-between;

    svg {
      font-size: 2rem;
      cursor: pointer;
    }
  }
`;

const VerticalCenteredText = styled.span`
  display: flex;
  align-items: center;
`;

export const Modal = memo(
  ({
    title,
    children,
    actions,
    width = 'sm',
    classes,
    open = false,
    onClose,
    printable = false,
    ...props
  }) => {
    const { printPage } = useElectron();
    return (
      <Dialog fullWidth maxWidth={width} classes={classes} open={open} onClose={onClose} {...props}>
        <ModalTitle>
          <VerticalCenteredText>{title}</VerticalCenteredText>
          <div>
            {printable ? (
              <Button
                color="primary"
                variant="outlined"
                onClick={() => printPage()}
                startIcon={<PrintIcon />}
                size="small"
              >
                Print
              </Button>
            ) : null}
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </div>
        </ModalTitle>
        <ModalContainer>
          <ModalContent>{children}</ModalContent>
          <DialogActions>{actions}</DialogActions>
        </ModalContainer>
      </Dialog>
    );
  });

export const connectRoutedModal = (baseRoute, suffix) =>
  connect(
    state => ({
      open: getCurrentRoute(state).startsWith(`${baseRoute}/${suffix}`),
      extraRoute: getCurrentRoute(state).replace(`${baseRoute}/${suffix}/`, ''),
    }),
    dispatch => ({
      onClose: () => dispatch(push(baseRoute)),
    }),
  );
