import React from 'react';
import { storiesOf } from '@storybook/react-native';
import { ThemeProvider } from 'styled-components/native';
import { themeSystem, CenterView } from '/styled/common';
import { theme } from '/styled/theme';
import { VisitChart } from './VisitChart';
import { YearlyChart } from './YearlyChart';
import { visitData, yearlyData } from './fixture';

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
