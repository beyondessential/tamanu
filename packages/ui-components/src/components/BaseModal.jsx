import CloseIcon from '@mui/icons-material/Close';
import PrintIcon from '@mui/icons-material/Print';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import MuiDialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogTitle, { dialogTitleClasses } from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import React, { memo } from 'react';
import styled from 'styled-components';

import { TAMANU_COLORS } from '../constants';
import { Button } from './Button';
import { TranslatedText } from './Translation';
import { VisuallyHidden } from './VisuallyHidden';

export const MODAL_PADDING_TOP_AND_BOTTOM = 18;
export const MODAL_PADDING_LEFT_AND_RIGHT = 32;
export const MODAL_TRANSITION_DURATION = 300;

/** Pixel max-widths for each `width` prop value. `md` is intentionally below MUI's default. */
export const MODAL_MAX_WIDTHS = {
  xs: 444,
  sm: 600,
  md: 830,
  lg: 1200,
  xl: 1536,
};

const dialogPaperWidthStyles = Object.entries(MODAL_MAX_WIDTHS)
  .map(
    ([size, px]) =>
      `.MuiDialog-paperWidth${size.charAt(0).toUpperCase()}${size.slice(1)} { max-width: ${px}px; }`,
  )
  .join('\n');

const Dialog = styled(MuiDialog)`
  ${dialogPaperWidthStyles}

  // The MUI v6 dialog paper is itself a scroll container (overflow-y: auto). Let the inner
  // ModalContainer own scrolling instead, so tall content doesn't produce a second scrollbar.
  .MuiDialog-paper {
    overflow: hidden;
  }

  @media print {
    .MuiPaper-root {
      print-color-adjust: exact;
    }

    .MuiDialogTitle-root,
    .MuiDialogActions-root {
      display: none;
    }
  }
`;

export const ModalContent = styled.div.attrs({ 'data-testid': 'modalcontent-bk4w' })`
  flex: 1 1 auto;
  padding-block: ${MODAL_PADDING_TOP_AND_BOTTOM}px;
  padding-inline: ${props => (props.$overrideContentPadding ? 0 : MODAL_PADDING_LEFT_AND_RIGHT)}px;
`;

const ModalContainer = styled.div`
  background-color: ${props => props.$color};
  // Overflow in the modal content ensures that the modal header stays fixed
  overflow: auto;
  // min-height: 0 lets this shrink within the flex-column paper so it (not the paper)
  // scrolls when content is taller than the modal.
  min-height: 0;

  @media print {
    background: none;
  }
`;

export const FullWidthRow = styled.div`
  grid-column: 1 / -1;
  margin-inline: -${MODAL_PADDING_LEFT_AND_RIGHT}px;
`;

const Header = styled.header`
  align-items: center;
  border-bottom: 1px solid ${TAMANU_COLORS.softOutline};
  display: flex;
  flex-wrap: wrap;
  padding-block: 14px;
  padding-inline: 32px 14px;
`;

const ModalTitle = styled(DialogTitle).attrs({ 'data-testid': 'modaltitle-ojhf' })`
  &.${dialogTitleClasses.root} {
    padding: 0;
    max-inline-size: 100%;
    line-height: 1.2;
  }
`;

const Actions = styled.div.attrs({ 'data-testid': 'actions-okdu' })`
  align-items: center;
  display: flex;
  flex-direction: row-reverse;
  gap: 8px;
  margin-inline-start: auto;
`;

function CloseButton(props) {
  return (
    <IconButton data-testid="iconbutton-eull" {...props}>
      <CloseIcon />
      <VisuallyHidden>
        <TranslatedText stringId="general.action.close" fallback="Close" />
      </VisuallyHidden>
    </IconButton>
  );
}

function PrintButton(props) {
  return (
    <Button
      color="primary"
      data-testid="styledbutton-z2pp"
      size="small"
      startIcon={<PrintIcon />}
      variant="outlined"
      {...props}
    >
      <TranslatedText stringId="general.action.print" fallback="Print" />
    </Button>
  );
}

export const BaseModal = memo(
  /**
   * @param {import('@material-ui/core/Dialog').DialogProps & {
   *   actions?: React.ReactNode;
   *   printable?: boolean;
   *   width?: keyof typeof MODAL_MAX_WIDTHS | false;
   * }} props
   */
  ({
    title,
    children,
    actions,
    // Preset sizes use MODAL_MAX_WIDTHS. Pass `false` when a styled Modal/FormModal
    // wrapper sets `.MuiPaper-root { max-width: … }` instead.
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

    const muiMaxWidth = width in MODAL_MAX_WIDTHS ? width : false;

    return (
      <Dialog
        fullWidth
        maxWidth={muiMaxWidth}
        classes={classes}
        open={open}
        onClose={onDialogClose}
        transitionDuration={MODAL_TRANSITION_DURATION}
        disableEnforceFocus
        {...props}
        data-testid="dialog-g9qi"
      >
        <Header>
          <ModalTitle>{title}</ModalTitle>
          <Actions>
            {cornerExitButton && <CloseButton onClick={onClose} disabled={!isClosable} />}
            {printable && <PrintButton onClick={handlePrint} />}
            {additionalActions}
          </Actions>
        </Header>
        <ModalContainer $color={color} data-testid="modalcontainer-uc2n">
          <ModalContent $overrideContentPadding={overrideContentPadding}>{children}</ModalContent>
          {actions && (
            <DialogActions component="footer" data-testid="dialogactions-jkc6">
              {actions}
            </DialogActions>
          )}
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
    color: ${props => props.theme.palette.text.secondary};
  }
`;

export const ModalLoader = ({ loadingText }) => (
  <Loader data-testid="loader-kayp">
    <CircularProgress size="5rem" data-testid="circularprogress-1eqo" />
    {loadingText && <Typography data-testid="typography-winh">{loadingText}</Typography>}
  </Loader>
);
