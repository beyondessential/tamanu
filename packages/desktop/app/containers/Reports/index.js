import React from 'react';
import PropTypes from 'prop-types';

import styled from 'styled-components';
import { withTheme } from '@material-ui/core/styles';

import { Route, Switch } from 'react-router-dom';
import { ReportGenerator } from './ReportGenerator';

const Content = styled.div`
  background: ${props => props.theme.palette.background.main};
  min-height: 100vh;
  margin-bottom: 0 !important;
`;

export const Reports = withTheme()(({ match, theme }) => (
  <Content theme={theme}>
    <Switch>
      <Route path={`${match.url}/:reportId`} component={ReportGenerator} />
    </Switch>
  </Content>
));

Reports.propTypes = {
  match: PropTypes.shape({ url: PropTypes.string }).isRequired,
  theme: PropTypes.shape({}),
};
