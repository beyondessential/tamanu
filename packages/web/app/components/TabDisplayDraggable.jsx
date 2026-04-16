import { Tabs } from '@material-ui/core';
import React from 'react';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import styled from 'styled-components';
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

const StyledTab = styled.div.attrs({ role: 'tab' })`
  color: ${props => props.theme.palette.text.tertiary};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: row;
  min-height: 72px;
  padding: 9px 12px 6px;
  font-weight: 500;
  position: relative;
  flex-shrink: 0;

  cursor: grab;
  &:active {
    cursor: grabbing;
  }

  &:hover {
    opacity: 1;
    background-color: ${Colors.veryLightBlue};
  }

  &[aria-selected='true'] {
    color: ${props => props.theme.palette.primary.main};
    opacity: 1;
  }

  &[data-dragging='true'] {
    opacity: 0.5;
  }

  && i:first-child {
    margin-bottom: 0;
    font-size: 22px;
  }
`;

const Icon = styled.i.attrs({ 'aria-hidden': true })`
  margin-right: 5px;
  color: ${Colors.softText};

  [aria-selected='true'] & {
    color: ${Colors.primary};
  }
`;

function getTabPanelId(key) {
  return key ? `tabpanel-${key}` : undefined;
}

export const TabDisplayDraggable = ({
  tabs,
  currentTab,
  onTabSelect,
  className,
  scrollable = true,
  handleDragEnd,
  ...tabProps
}) => {
  tabs = tabs.map((t, index) => ({
    ...t,
    order: index,
  }));
  const currentTabData = tabs.find(t => t.key === currentTab);

  const onDragEnd = result => {
    handleDragEnd(result);
  };

  return (
    <DragDropContext onDragEnd={onDragEnd} data-testid="dragdropcontext-v5fu">
      <TabBar className={className} data-testid="tabbar-zlyy">
        <Droppable
          droppableId="tab-display-droppable"
          direction="horizontal"
          data-testid="droppable-3q8i"
        >
          {provided => (
            <TabContainer
              ref={provided.innerRef}
              variant={scrollable ? 'scrollable' : 'fixed'}
              scrollButtons={scrollable ? 'on' : 'off'}
              value={currentTabData?.order || 0}
              {...provided.droppableProps}
              data-testid="tabcontainer-uai8"
            >
              {tabs.map(({ key, label, render, icon }, index) => (
                <Draggable
                  key={key}
                  draggableId={key}
                  index={index}
                  isDragDisabled={!render}
                  data-testid={`draggable-cehj-${key}`}
                >
                  {(provided, snapshot) => (
                    <StyledTab
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      style={provided.draggableProps.style}
                      onClick={() => render && onTabSelect(key)}
                      aria-controls={getTabPanelId(key)}
                      aria-selected={currentTabData?.key === key}
                      data-dragging={snapshot.isDragging}
                      data-testid={`styledtab-ccs8-${key}`}
                    >
                      {icon && (
                        <Icon aria-hidden className={icon} data-testid={`icon-1iqd-${key}`} />
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
        <div id={getTabPanelId(currentTabData?.key)} role="tabpanel">
          {currentTabData?.render(tabProps)}
        </div>
      </TabBar>
    </DragDropContext>
  );
};
