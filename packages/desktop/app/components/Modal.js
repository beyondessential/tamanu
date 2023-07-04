import React, { memo } from 'react';

import { connect } from 'react-redux';
import { push } from 'connected-react-router';

import styled from 'styled-components';
import MuiDialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogActions from '@material-ui/core/DialogActions';
import PrintIcon from '@material-ui/icons/Print';
import CloseIcon from '@material-ui/icons/Close';
import { Box, CircularProgress, IconButton, Typography } from '@material-ui/core';
import { getCurrentRoute } from '../store/router';
import { Colors } from '../constants';
import { Button } from './Button';

export const MODAL_PADDING = 32;

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
    .MuiPaper-root {
      -webkit-print-color-adjust: exact;
    }

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

  @media print {
    background: none;
  }
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

const StyledButton = styled(Button)`
  margin-left: 8px;
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
    onPrint = null,
    additionalActions,
    ...props
  }) => {
    const handlePrint = () => {
      // If a custom print handler has been passed use that. For example for printing the contents
      // of an iframe. Otherwise use the default print page
      if (onPrint) {
        onPrint();
      } else {
        window.print();
      }
    };

    return (
      <Dialog fullWidth maxWidth={width} classes={classes} open={open} onClose={onClose} {...props}>
        <ModalTitle>
          <VerticalCenteredText>{title}</VerticalCenteredText>
          <div>
            {additionalActions}
            {printable && (
              <StyledButton
                color="primary"
                variant="outlined"
                onClick={handlePrint}
                startIcon={<PrintIcon />}
                size="small"
              >
                Print
              </StyledButton>
            )}
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
  },
);

const Loader = styled(Box)`
  padding: 40px 0;
  text-align: center;

  .MuiTypography-root {
    margin-top: 40px;
    font-weight: 500;
    font-size: 16px;
    line-height: 21px;
    color: ${props => props.theme.palette.text.secondary};
  }
`;

export const ModalLoader = ({ loadingText }) => (
  <Loader>
    <CircularProgress size="5rem" />
    <Typography>{loadingText}</Typography>
  </Loader>
);

export const connectRoutedModal = (baseRoute, suffix) =>
  connect(
    state => ({
      open: getCurrentRoute(state).startsWith(`${baseRoute}/${suffix}`),
    }),
    dispatch => ({
      onClose: () => dispatch(push(baseRoute)),
    }),
  );
