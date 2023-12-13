import { CenterView, themeSystem } from '/styled/common';
import { theme } from '/styled/theme';
import { storiesOf } from '@storybook/react-native';
import React from 'react';
import { ThemeProvider } from 'styled-components/native';
import { visitData, yearlyData } from './fixture';
import { VisitChart } from './VisitChart';
import { YearlyChart } from './YearlyChart';

storiesOf('Chart', module)
  .addDecorator((story: Function) => (
    <ThemeProvider theme={themeSystem}>
      <CenterView background={theme.colors.BACKGROUND_GREY}>
        {story()}
      </CenterView>
    </ThemeProvider>
  ))
  .add('Monthly BarChart', () => <VisitChart data={visitData} />)
  .add('Yearly BarChart', () => <YearlyChart data={yearlyData} />);
