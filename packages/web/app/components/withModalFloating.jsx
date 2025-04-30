import React from 'react';
import PropTypes from 'prop-types';
import Draggable from 'react-draggable';
import { Resizable } from 're-resizable';
import { Paper } from '@material-ui/core';
import styled from 'styled-components';

import { ResizeCornerIcon } from './Icons/ResizeCornerIcon';
import { ResizeHorizontalIcon } from './Icons/ResizeHorizontalIcon';
import { ResizeVerticalIcon } from './Icons/ResizeVerticalIcon';
import { Colors } from '../constants';

export const withModalFloating = ModalComponent => {
  const StyledModalComponent = styled(ModalComponent)`
    &.MuiDialog-root,
    & .MuiDialog-container {
      pointer-events: none;
    }

    & .MuiDialog-paper {
      pointer-events: auto;
    }
  `;

  const FloatingModal = ({
    baseWidth,
    baseHeight,
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
            defaultSize={{ width: baseWidth, height: baseHeight }}
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
      <StyledModalComponent
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
    baseWidth: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    baseHeight: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
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
    baseWidth: 600,
    baseHeight: 400,
    minConstraints: [300, 200],
    maxConstraints: [900, 600],
    enableResizeHandle: { right: true, bottom: true, bottomRight: true },
    handleComponent: {
      right: <ResizeVerticalIcon width={20} height={20} htmlColor={Colors.darkestText} />,
      bottom: <ResizeHorizontalIcon width={20} height={20} htmlColor={Colors.darkestText} />,
      bottomRight: <ResizeCornerIcon width={20} height={20} htmlColor={Colors.darkestText} />,
    },
    handleStyles: {
      right: { position: 'absolute', right: 4, top: '50%', cursor: 'ew-resize' },
      bottom: { position: 'absolute', bottom: 4, left: '50%', cursor: 'ns-resize' },
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
