import React, { useRef, useCallback, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Draggable from 'react-draggable';
import { Resizable } from 're-resizable';
import { Paper } from '@material-ui/core';
import styled from 'styled-components';

import { ResizeCornerIcon } from './Icons/ResizeCornerIcon';
import { ResizeHorizontalIcon } from './Icons/ResizeHorizontalIcon';
import { ResizeVerticalIcon } from './Icons/ResizeVerticalIcon';
import { Colors } from '../constants';

const calculateDefaultPosition = (baseWidth, baseHeight) => {
  if (typeof window !== 'undefined') {
    return {
      x: Math.max(0, Math.round(window.innerWidth / 2 - Number(baseWidth) / 2)),
      y: Math.max(0, Math.round(window.innerHeight / 2 - Number(baseHeight) / 2)),
    };
  }
  return { x: 0, y: 0 };
};

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
    // We use both state and refs for position/size:
    // - State triggers re-renders when window resizes (to recenter modal) and keeps
    //   react-draggable/re-resizable controlled (they need prop updates to reflect changes)
    // - Refs provide stable references to the memoized PaperComponent callback, preventing
    //   it from recreating on every render (which would remount Dialog and reset form state)
    // Refs are synced from state/props on each render so PaperComponent always reads current values
    const positionRef = useRef({ x: 0, y: 0 });
    const baseSizeRef = useRef({ width: Number(baseWidth), height: Number(baseHeight) });
    const currentSizeRef = useRef({ width: Number(baseWidth), height: Number(baseHeight) });
    const minConstraintsRef = useRef(minConstraints);
    const maxConstraintsRef = useRef(maxConstraints);

    const [position, setPosition] = useState(() =>
      calculateDefaultPosition(baseWidth, baseHeight),
    );
    const [size, setSize] = useState(() => ({
      width: Number(baseWidth),
      height: Number(baseHeight),
    }));

    // Recenter and reset to default size when window is resized
    useEffect(() => {
      const handleResize = () => {
        setPosition(calculateDefaultPosition(baseSizeRef.current.width, baseSizeRef.current.height));
        setSize(baseSizeRef.current);
      };
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Update refs with latest prop values so PaperComponent won't recreate
    baseSizeRef.current = { width: Number(baseWidth), height: Number(baseHeight) };
    currentSizeRef.current = size;
    minConstraintsRef.current = minConstraints;
    maxConstraintsRef.current = maxConstraints;
    positionRef.current = position;

    // PaperComponent reads position from positionRef so it stays referentially stable
    // when position changes (e.g. on resize). That avoids Dialog remounting and
    // resetting form state inside the modal.
    const PaperComponent = useCallback(
      paperProps => {
        const { style, className, children, ...rest } = paperProps;
        return (
          <Draggable
            handle={draggableHandle}
            bounds={draggableBounds}
            position={positionRef.current}
            cancel=".MuiDialogTitle-root button, .MuiDialogActions-root button"
            onStop={(e, data) => {
              const next = { x: data.x, y: data.y };
              positionRef.current = next;
              setPosition(next);
            }}
          >
            <Resizable
              size={currentSizeRef.current}
              minWidth={minConstraintsRef.current[0]}
              minHeight={minConstraintsRef.current[1]}
              maxWidth={maxConstraintsRef.current[0]}
              maxHeight={maxConstraintsRef.current[1]}
              enable={enableResizeHandle}
              resizeRatio={resizeRatio}
              handleComponent={handleComponent}
              handleStyles={handleStyles}
              onResizeStop={(e, direction, ref, d) => {
                setSize({
                  width: currentSizeRef.current.width + d.width,
                  height: currentSizeRef.current.height + d.height,
                });
              }}
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
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [
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
