import React from 'react';
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
  transition: all 0.3s;

  &:hover {
    opacity: 1;
    background-color: ${Colors.veryLightBlue};
  }

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

export const TabDisplayDraggable = ({
  tabs,
  currentTab,
  onTabSelect,
  className,
  scrollable = true,
  handleDragEnd,
  ...tabProps
}) => {
  const currentTabData = tabs.find(t => t.key === currentTab);

  const onDragEnd = result => {
    handleDragEnd(result);
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
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
            </TabContainer>
          )}
        </Droppable>
        <div>{currentTabData?.render({ ...tabProps })}</div>
      </TabBar>
    </DragDropContext>
  );
};
