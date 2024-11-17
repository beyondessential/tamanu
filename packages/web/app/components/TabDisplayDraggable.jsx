import React from 'react';
import styled from 'styled-components';
import { Box, Tabs } from '@material-ui/core';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import cn from 'classnames';
import { Colors } from '../constants';
import grabCursor from '../assets/images/grab_cursor.svg';

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
  * {
    cursor: url(data:image/svg+xml,%3csvg%20width='16'%20height='16'%20viewBox='0%200%2016%2016'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cpath%20d='M3.33909%2010.5263V1.93684C3.33909%201.53483%203.50313%201.14928%203.79511%200.865017C4.0871%200.580751%204.48311%200.421053%204.89604%200.421053C5.30897%200.421053%205.70499%200.580751%205.99697%200.865017C6.28896%201.14928%206.45299%201.53483%206.45299%201.93684V5.47368L11.9667%206.0699C12.4281%206.11979%2012.8723%206.26952%2013.2666%206.50811C13.6609%206.74671%2013.9955%207.06813%2014.2458%207.44885C14.496%207.82958%2014.6557%208.25997%2014.713%208.70852C14.7703%209.15707%2014.7239%209.61243%2014.5772%2010.0413L12.6808%2015.5789H4.37706L2.17553%2013.4356C1.88623%2013.1541%201.65675%2012.8198%201.50021%2012.4518C1.34366%2012.0839%201.26311%2011.6895%201.26315%2011.2913V9.51579C1.26315%208.97977%201.48187%208.46571%201.87118%208.08669C2.2605%207.70767%202.78852%207.49474%203.33909%207.49474'%20fill='white'/%3e%3cpath%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M4.89604%200.842105C4.5912%200.842105%204.30103%200.960109%204.08882%201.16671C3.877%201.37293%203.76014%201.6502%203.76014%201.93684V10.5263C3.76014%2010.7589%203.57163%2010.9474%203.33909%2010.9474C3.10655%2010.9474%202.91804%2010.7589%202.91804%2010.5263V7.96844C2.63456%208.04058%202.37402%208.18478%202.1649%208.38838C1.85574%208.68936%201.68421%209.09514%201.68421%209.51579V11.2913C1.68417%2011.6326%201.75319%2011.971%201.88765%2012.287C2.02211%2012.603%202.21953%2012.8909%202.4692%2013.1339L4.54817%2015.1579H12.3799L14.1788%209.90492C14.3048%209.53688%2014.3445%209.14642%2014.2953%208.76191C14.2462%208.37739%2014.1093%208.00776%2013.8939%207.68013C13.6785%207.35246%2013.3899%207.07486%2013.0486%206.86836C12.7073%206.66183%2012.3222%206.53184%2011.9214%206.48851L6.40773%205.8923C6.19395%205.86918%206.03194%205.6887%206.03194%205.47368V1.93684C6.03194%201.6502%205.91508%201.37293%205.70326%201.16671C5.49105%200.960109%205.20089%200.842105%204.89604%200.842105ZM2.91804%207.10865V1.93684C2.91804%201.41946%203.12925%200.925632%203.5014%200.563327C3.87316%200.201394%204.37503%200%204.89604%200C5.41705%200%205.91893%200.201394%206.29069%200.563327C6.66283%200.925633%206.87405%201.41946%206.87405%201.93684V5.09571L12.0119%205.65128C12.5341%205.70774%2013.0372%205.87721%2013.4846%206.14787C13.9319%206.41855%2014.3125%206.7838%2014.5976%207.21758C14.8828%207.6514%2015.0651%208.14255%2015.1307%208.65513C15.1962%209.16772%2015.1431%209.68798%2014.9755%2010.1776L13.0791%2015.7154C13.0208%2015.8856%2012.8608%2016%2012.6808%2016H4.37706C4.26734%2016%204.16196%2015.9572%204.08334%2015.8806L1.88186%2013.7374C1.55295%2013.4172%201.29139%2013.0365%201.11276%2012.6167C0.934128%2012.1968%200.842053%2011.7464%200.842102%2011.2913V9.51579C0.842102%208.86441%201.10799%208.24206%201.57747%207.785C1.94545%207.42675%202.41483%207.19284%202.91804%207.10865ZM7.15789%207.57895C7.39043%207.57895%207.57894%207.76746%207.57894%208V12.2105C7.57894%2012.4431%207.39043%2012.6316%207.15789%2012.6316C6.92535%2012.6316%206.73684%2012.4431%206.73684%2012.2105V8C6.73684%207.76746%206.92535%207.57895%207.15789%207.57895ZM10.5263%207.57895C10.7589%207.57895%2010.9474%207.76746%2010.9474%208V12.2105C10.9474%2012.4431%2010.7589%2012.6316%2010.5263%2012.6316C10.2938%2012.6316%2010.1053%2012.4431%2010.1053%2012.2105V8C10.1053%207.76746%2010.2938%207.57895%2010.5263%207.57895Z'%20fill='%23111111'/%3e%3c/svg%3e), auto !important;
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
  transition: opacity, background-color 0.3s;
  cursor: url(${grabCursor}), auto !important;

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
        <Droppable droppableId="tab-display-droppable" direction="horizontal">
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
                      style={provided.draggableProps.style}
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
