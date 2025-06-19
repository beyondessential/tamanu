import React from 'react';
import { Notification, TopBar, TranslatedText } from '../components';

export const NotActiveView = React.memo(() => (
  <>
    <TopBar
      title={
        <TranslatedText
          stringId="sectionNotActive.title"
          fallback="Not active yet"
          data-testid="translatedtext-3loi"
        />
      }
      data-testid="topbar-3loi"
    />
    <Notification
      message={
        <TranslatedText
          stringId="sectionNotActive.message"
          fallback="This section is not activated yet."
        />
      }
      data-testid="notification-db7o"
    />
  </>
));
