import React from 'react';
import { storiesOf } from '@storybook/react-native';
import { ThemeProvider } from 'styled-components/native';
import { themeSystem, CenterView } from '../../styled/common';
import { VisitChart } from './VisitChart';
import { visitData } from './fixture';
import { theme } from '../../styled/theme';

storiesOf('Chart', module)
  .addDecorator((story: Function) => (
    <ThemeProvider theme={themeSystem}>
      <CenterView background={theme.colors.BACKGROUND_GREY}>
        {story()}
      </CenterView>
    </ThemeProvider>
  ))
  .add('BarChart', () => <VisitChart data={visitData} />);
