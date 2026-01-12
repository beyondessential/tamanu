import React, { memo } from 'react';

import styled from 'styled-components';
import MuiDialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogActions from '@material-ui/core/DialogActions';
import PrintIcon from '@material-ui/icons/Print';
import CloseIcon from '@material-ui/icons/Close';
import { Box, CircularProgress, IconButton, Typography } from '@material-ui/core';
import { Button } from './Button';
import { TranslatedText } from './Translation';
import { TAMANU_COLORS } from '../constants';

export const MODAL_PADDING_TOP_AND_BOTTOM = 18;
export const MODAL_PADDING_LEFT_AND_RIGHT = 32;
export const MODAL_TRANSITION_DURATION = 300;

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
  padding: ${MODAL_PADDING_TOP_AND_BOTTOM}px
    ${(props) => (props.$overrideContentPadding ? 0 : MODAL_PADDING_LEFT_AND_RIGHT)}px;
`;

const ModalContainer = styled.div`
  background: ${(props) => props.$color};
  // Overflow in the modal content ensures that the modal header stays fixed
  overflow: auto;

  @media print {
    background: none;
  }
`;

export const FullWidthRow = styled.div`
  margin: 0 -${MODAL_PADDING_LEFT_AND_RIGHT}px;
  grid-column: 1 / -1;
`;

const ModalTitle = styled(DialogTitle)`
  padding: 14px 14px 14px 32px;
  border-bottom: 1px solid ${TAMANU_COLORS.softOutline};

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
  padding: 12px 0;
`;

const StyledButton = styled(Button)`
  margin-left: 8px;
`;

export const BaseModal = memo(
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
    color = TAMANU_COLORS.background,
    overrideContentPadding = false,
    cornerExitButton = true,
    isClosable = true,
    fixedBottomRow = false,
    bottomRowContent,
    ...props
  }) => {
    const handlePrint = () => {
      // If a custom print handler has been passed use that. For example for printing the contents
      // of an iframe. Otherwise use the default electron print page
      if (onPrint) {
        onPrint();
      } else {
        // eslint-disable-next-line no-undef
        print();
      }
    };

    const onDialogClose = (event, reason) => {
      switch (reason) {
        case 'escapeKeyDown':
          // respect this
          onClose();
          break;
        case 'backdropClick':
          break; // do nothing
        default:
          break; // Shouldn't happen according to MuiDialog spec
      }
    };

    return (
      <Dialog
        fullWidth
        maxWidth={width}
        classes={classes}
        open={open}
        onClose={onDialogClose}
        transitionDuration={MODAL_TRANSITION_DURATION}
        disableEnforceFocus
        {...props}
        data-testid="dialog-g9qi"
      >
        <ModalTitle data-testid="modaltitle-ojhf">
          <VerticalCenteredText data-testid="verticalcenteredtext-ni4s">
            {title}
          </VerticalCenteredText>
          <Box flexShrink={0} data-testid="box-okdu">
            {additionalActions}
            {printable && (
              <StyledButton
                color="primary"
                variant="outlined"
                onClick={handlePrint}
                startIcon={<PrintIcon data-testid="printicon-mgui" />}
                size="small"
                data-testid="styledbutton-z2pp"
              >
                <TranslatedText
                  stringId="general.action.print"
                  fallback="Print"
                  data-testid="translatedtext-0ush"
                />
              </StyledButton>
            )}
            {cornerExitButton && (
              <IconButton onClick={onClose} disabled={!isClosable} data-testid="iconbutton-eull">
                <CloseIcon data-testid="closeicon-z1u6" />
              </IconButton>
            )}
          </Box>
        </ModalTitle>
        <ModalContainer $color={color} data-testid="modalcontainer-uc2n">
          <ModalContent
            $overrideContentPadding={overrideContentPadding}
            data-testid="modalcontent-bk4w"
          >
            {children}
          </ModalContent>
          <DialogActions data-testid="dialogactions-jkc6">{actions}</DialogActions>
        </ModalContainer>
        {fixedBottomRow && bottomRowContent}
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
    color: ${(props) => props.theme.palette.text.secondary};
  }
`;

export const ModalLoader = ({ loadingText }) => (
  <Loader data-testid="loader-kayp">
    <CircularProgress size="5rem" data-testid="circularprogress-1eqo" />
    {loadingText && <Typography data-testid="typography-winh">{loadingText}</Typography>}
  </Loader>
);
