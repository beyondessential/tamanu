import React from 'react';
import PropTypes from 'prop-types';
import Draggable from 'react-draggable';
import { Resizable } from 're-resizable';
import { Paper } from '@material-ui/core';
import { ResizeCornerIcon } from './Icons/ResizeCornerIcon';
import { Colors } from '../constants';
/**
 * HOC that makes any MUI Dialog-based modal draggable and resizable.
 * Usage:
 *   const FloatingMyModal = withModalFloating(MyModal);
 *   <FloatingMyModal open onClose title="...">...</FloatingMyModal>
 */
export const withModalFloating = ModalComponent => {
  const FloatingModal = ({
    defaultWidth,
    defaultHeight,
    minConstraints,
    maxConstraints,
    enableResizeHandle,
    handleComponent,
    handleStyles,
    draggableHandle,
    draggableBounds,
    resizeRatio,

    // Specific props for the modal
    hideBackdrop,
    BackdropProps,

    // All other props go to the wrapped modal
    ...modalProps
  }) => {
    // Custom PaperComponent for dragging + resizing
    const PaperComponent = paperProps => {
      const { style, className, children, ...rest } = paperProps;
      return (
        <Draggable handle={draggableHandle} bounds={draggableBounds}>
          <Resizable
            defaultSize={{ width: defaultWidth, height: defaultHeight }}
            minWidth={minConstraints[0]}
            minHeight={minConstraints[1]}
            maxWidth={maxConstraints[0]}
            maxHeight={maxConstraints[1]}
            enable={enableResizeHandle}
            resizeRatio={resizeRatio}
            handleComponent={handleComponent}
            handleStyles={handleStyles}
            className={className}
            style={{ ...style, position: 'absolute', overflow: 'visible' }}
          >
            <Paper
              {...rest}
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              {children}
            </Paper>
          </Resizable>
        </Draggable>
      );
    };

    return (
      <ModalComponent
        {...modalProps}
        fullWidth={false}
        maxWidth={false}
        PaperComponent={PaperComponent}
        hideBackdrop={hideBackdrop}
        BackdropProps={BackdropProps}
      />
    );
  };

  FloatingModal.propTypes = {
    defaultWidth: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    defaultHeight: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    minConstraints: PropTypes.arrayOf(PropTypes.number),
    maxConstraints: PropTypes.arrayOf(PropTypes.number),
    enableResizeHandle: PropTypes.object,
    handleComponent: PropTypes.object,
    handleStyles: PropTypes.object,
    draggableHandle: PropTypes.string,
    draggableBounds: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    resizeRatio: PropTypes.number,
  };

  FloatingModal.defaultProps = {
    defaultWidth: 600,
    defaultHeight: 400,
    minConstraints: [300, 200],
    maxConstraints: [900, 600],
    enableResizeHandle: { bottomRight: true },
    handleComponent: {
      bottomRight: <ResizeCornerIcon width={20} height={20} htmlColor={Colors.darkestText} />,
    },
    handleStyles: {
      bottomRight: { position: 'absolute', right: 0, bottom: 0, cursor: 'nwse-resize' },
    },
    draggableHandle: '.MuiDialogTitle-root',
    draggableBounds: 'body',
    hideBackdrop: true,
    BackdropProps: { invisible: true, style: { pointerEvents: 'none' } },
    resizeRatio: 2,
  };

  return FloatingModal;
};
