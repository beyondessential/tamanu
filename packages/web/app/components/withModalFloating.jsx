import React, { useEffect, useRef, useCallback, useMemo } from 'react';
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

    & .MuiDialog-container {
      align-items: flex-start;
      justify-content: flex-start;
    }

    & .MuiDialog-paper {
      pointer-events: auto;
      margin: 0;
    }

    & ${props => props.draggableHandle} {
      cursor: move;
    }

    &.MuiDialog-root {
      z-index: 1500 !important;
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
    hideBackdrop,
    BackdropProps,
    ...modalProps
  }) => {
    const positionRef = useRef({ x: 0, y: 0 });
    // Capture initial values in refs to prevent PaperComponent from recreating on window resize
    const initialSizeRef = useRef({ width: baseWidth, height: baseHeight });
    const initialMinConstraintsRef = useRef(minConstraints);
    // Store maxConstraints in a ref that we can update dynamically
    const maxConstraintsRef = useRef(maxConstraints);

    // Update maxConstraints ref when prop changes (for dynamic constraint updates)
    useEffect(() => {
      maxConstraintsRef.current = maxConstraints;
    }, [maxConstraints]);

    const defaultPosition = useMemo(() => {
      if (typeof window !== 'undefined') {
        const x = Math.max(0, Math.round(window.innerWidth / 2 - Number(baseWidth) / 2));
        const y = Math.max(0, Math.round(window.innerHeight / 2 - Number(baseHeight) / 2));
        return { x, y };
      }
      return { x: 0, y: 0 };
    }, [baseWidth, baseHeight]);

    const PaperComponent = useCallback(
      paperProps => {
        const { style, className, children, ...rest } = paperProps;
        return (
          <Draggable
            handle={draggableHandle}
            bounds={draggableBounds}
            defaultPosition={defaultPosition}
            cancel=".MuiDialogTitle-root button, .MuiDialogActions-root button"
            onStop={(e, data) => {
              positionRef.current = { x: data.x, y: data.y };
            }}
          >
            <Resizable
              defaultSize={initialSizeRef.current}
              minWidth={initialMinConstraintsRef.current[0]}
              minHeight={initialMinConstraintsRef.current[1]}
              maxWidth={maxConstraintsRef.current[0]}
              maxHeight={maxConstraintsRef.current[1]}
              enable={enableResizeHandle}
              resizeRatio={resizeRatio}
              handleComponent={handleComponent}
              handleStyles={handleStyles}
              className={className}
              style={{ ...style, position: 'absolute', overflow: 'visible', zIndex: 1500 }}
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
      },
      [
        positionRef,
        draggableHandle,
        draggableBounds,
        enableResizeHandle,
        handleComponent,
        handleStyles,
        resizeRatio,
      ],
    );

    return (
      <StyledModalComponent
        {...modalProps}
        fullWidth={false}
        maxWidth={false}
        PaperComponent={PaperComponent}
        hideBackdrop={hideBackdrop}
        BackdropProps={BackdropProps}
        draggableHandle={draggableHandle}
        disableEnforceFocus
        disableAutoFocus
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
      left: <ResizeVerticalIcon width={20} height={20} htmlColor={Colors.darkestText} />,
      right: <ResizeVerticalIcon width={20} height={20} htmlColor={Colors.darkestText} />,
      top: <ResizeHorizontalIcon width={20} height={20} htmlColor={Colors.darkestText} />,
      bottom: <ResizeHorizontalIcon width={20} height={20} htmlColor={Colors.darkestText} />,
      bottomRight: <ResizeCornerIcon width={20} height={20} htmlColor={Colors.darkestText} />,
    },
    handleStyles: {
      left: { position: 'absolute', left: 4, top: '50%', cursor: 'ew-resize' },
      right: { position: 'absolute', right: 4, top: '50%', cursor: 'ew-resize' },
      top: { position: 'absolute', top: 4, left: '50%', cursor: 'ns-resize' },
      bottom: { position: 'absolute', bottom: 4, left: '50%', cursor: 'ns-resize' },
      bottomRight: { position: 'absolute', right: 0, bottom: 0, cursor: 'nwse-resize' },
    },
    draggableHandle: '.MuiDialogTitle-root',
    draggableBounds: 'body',
    hideBackdrop: true,
    BackdropProps: { invisible: true, style: { pointerEvents: 'none' } },
    resizeRatio: 1,
  };

  return FloatingModal;
};
