import React, { useState } from 'react';
import styled from 'styled-components';
import { Box, Tabs } from '@material-ui/core';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import cn from 'classnames';
import { Colors } from '../constants';

const TabBar = styled.div`
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const TabContainer = styled(Tabs)`
  background: ${Colors.white};
  position: relative;

  .MuiTabs-indicator {
    background-color: ${Colors.primary};
  }
`;

const StyledTab = styled(Box)`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: row;
  text-transform: capitalize;
  min-height: 72px;
  padding: 9px 12px 6px;
  font-weight: 500;
  opacity: 0.7;
  position: relative;
  flex-shrink: 0;

  &.selected {
    opacity: 1;
    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      padding-top: 2px;
      background-color: ${Colors.primary};
      width: 100%;
    }
  }

  &.isDragging {
    opacity: 0.5;
  }

  && i:first-child {
    margin-bottom: 0;
    font-size: 22px;
  }
`;

const Icon = styled.i`
  color: ${props => props.color};
  margin-right: 5px;
`;

export const TabDisplayDraggable = React.memo(
  ({ tabs, currentTab, onTabSelect, className, scrollable = true, handleDragEnd, ...tabProps }) => {
    const currentTabData = tabs.find(t => t.key === currentTab);
    const [placeholderProps, setPlaceholderProps] = useState();

    const onDragEnd = result => {
      setPlaceholderProps();
      handleDragEnd(result);
    };

    const onDragUpdate = update => {
      if (!update?.destination) {
        setPlaceholderProps();
        return;
      }

      const draggableId = update.draggableId;
      const sourceIndex = update.source.index;
      const destinationIndex = update.destination.index;

      const domQuery = `[data-rbd-drag-handle-draggable-id='${draggableId}']`;
      const draggedDOM = document.querySelector(domQuery);

      if (!draggedDOM) {
        return;
      }
      const { clientHeight, clientWidth } = draggedDOM;

      const clientX = [...draggedDOM.parentNode.children]
        .slice(0, destinationIndex + (sourceIndex < destinationIndex ? 1 : 0))
        .filter(element => element !== draggedDOM)
        .reduce((total, element) => {
          return total + element.clientWidth;
        }, 0);

      setPlaceholderProps({
        clientHeight,
        clientWidth,
        clientX,
      });
    };

    return (
      <DragDropContext onDragEnd={onDragEnd} onDragUpdate={onDragUpdate}>
        <TabBar className={className}>
          <Droppable droppableId="droppable" direction="horizontal">
            {provided => (
              <TabContainer
                ref={provided.innerRef}
                variant={scrollable ? 'scrollable' : 'fixed'}
                scrollButtons={scrollable ? 'on' : 'off'}
                value={currentTab}
                {...provided.droppableProps}
              >
                {tabs.map(({ key, label, render, icon }, index) => (
                  <Draggable key={key} draggableId={key} index={index} isDragDisabled={!render}>
                    {(provided, snapshot) => (
                      <StyledTab
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        onClick={() => render && onTabSelect(key)}
                        className={cn({
                          selected: currentTabData?.key === key,
                          isDragging: snapshot.isDragging,
                        })}
                      >
                        {icon && (
                          <Icon
                            className={icon}
                            color={currentTabData?.key === key ? Colors.primary : Colors.softText}
                          />
                        )}
                        {label}
                      </StyledTab>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}

                {placeholderProps && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: placeholderProps.clientX + placeholderProps.clientWidth / 2,
                      transform: 'translateY(-50%)',
                      height: '50%',
                      width: '2px',
                      backgroundColor: Colors.primary,
                      borderRadius: '16px',
                    }}
                  />
                )}
              </TabContainer>
            )}
          </Droppable>
          <div>{currentTabData?.render({ ...tabProps })}</div>
        </TabBar>
      </DragDropContext>
    );
  },
);
