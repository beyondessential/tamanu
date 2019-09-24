import React from 'react';
import styled from 'styled-components';

import { Tabs, Tab, SvgIcon } from '@material-ui/core';

const TabContainer = styled(Tabs)`
  background: #fff;
`;

const StyledTab = styled(Tab)`
  span {
    flex-direction: row;
  }

  && svg:first-child {
    margin-bottom: 0;
  }
`;

export const TabDisplay = React.memo(({ tabs, currentTab, onTabSelect, ...tabProps }) => {
  const currentTabData = tabs.find(t => t.key === currentTab);
  const buttons = tabs.map(({ key, label, render }) => (
    <StyledTab
      key={key}
      icon={
        <SvgIcon htmlColor={currentTabData.key === key ? '#326699' : '#b8b8b8'}>
          {' '}
          <path d="M16.2656 0H3.73438C2.36229 0 1.25 1.11229 1.25 2.48438V17.5156C1.25 18.8877 2.36229 20 3.73438 20H16.2656C17.6377 20 18.75 18.8877 18.75 17.5156V2.48438C18.75 1.11229 17.6377 0 16.2656 0ZM10.9572 7.32328L12.5909 7.74094C12.9716 7.83836 13.2389 8.18836 13.2389 8.58969V9.36494H6.96436V8.58969C6.96436 8.18836 7.23159 7.83836 7.61234 7.74094L9.246 7.32328V6.72098C8.73491 6.3319 8.39038 5.63744 8.39038 4.98994V3.96707C8.39038 3.60453 8.65705 3.20144 8.98617 3.06669L10.3321 2.51632C10.4413 2.47169 10.5716 2.52128 10.6258 2.6324L10.8503 3.09178H10.9569C11.4295 3.09178 11.8128 3.48553 11.8128 3.96678V4.98994C11.8128 5.63744 11.4683 6.3319 10.9572 6.72098V7.32328ZM5.68497 13.4094C5.18006 13.4094 4.77075 13.0023 4.77075 12.5C4.77075 11.9978 5.18006 11.5907 5.68497 11.5907H14.4815C14.9864 11.5907 15.3958 11.9978 15.3958 12.5C15.3958 13.0023 14.9864 13.4094 14.4815 13.4094H5.68497ZM4.77075 16.25C4.77075 16.7523 5.18006 17.1594 5.68497 17.1594H14.4815C14.9864 17.1594 15.3958 16.7523 15.3958 16.25C15.3958 15.7478 14.9864 15.3407 14.4815 15.3407H5.68497C5.18006 15.3407 4.77075 15.7478 4.77075 16.25Z" />
        </SvgIcon>
      }
      style={{ minWidth: 'auto' }}
      label={label}
      disabled={!render}
      value={key}
      onClick={() => onTabSelect(key)}
    />
  ));
  return (
    <div>
      <TabContainer value={currentTab}>{buttons}</TabContainer>
      <div>{currentTabData.render({ ...tabProps })}</div>
    </div>
  );
});
