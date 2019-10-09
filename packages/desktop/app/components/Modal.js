import React, { memo } from 'react';

import { connect } from 'react-redux';
import { push } from 'connected-react-router';

import styled from 'styled-components';
import MuiDialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogActions from '@material-ui/core/DialogActions';
import CloseIcon from '@material-ui/icons/Close';
import { getCurrentRoute } from '../store/router';
import { Colors } from '../constants';

const MODAL_PADDING = 32;

const Dialog = styled(MuiDialog)`
  /* To keep consistent use of styled-components,
     re-define dialog paper classes here instead of
     through withStyles(). The global classes for each rule
     can be found in the docs: https://material-ui.com/api/dialog/#css
  */
  .MuiDialog-paperWidthMd {
    max-width: 830px;
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
      margin-top: -10px;
      margin-right: -10px;
    }
  }
`;

export const Modal = memo(
  ({ title, children, actions, width = 'sm', classes, open = false, ...props }) => (
    <Dialog fullWidth maxWidth={width} classes={{ ...classes }} open={open} {...props}>
      <ModalTitle>
        <span>{title}</span> <CloseIcon onClick={() => props.onClose()} />
      </ModalTitle>
      <ModalContainer>
        <ModalContent>{children}</ModalContent>
        <DialogActions>{actions}</DialogActions>
      </ModalContainer>
    </Dialog>
  ),
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
