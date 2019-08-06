import React from 'react';
import PropTypes from 'prop-types';

import { Route, Switch } from 'react-router-dom';
import { ReportGenerator } from './ReportGenerator';

import styled from 'styled-components';
import { withTheme } from '@material-ui/core/styles';

const Content = styled.div`
  background: ${props => props.theme.palette.background.main};
  min-height: 100vh;
  margin-bottom: 0 !important;
`;

const _Reports = ({ match, theme }) => (
  <Content theme={theme}>
    <Switch>
      <Route path={`${match.url}/:reportId`} component={ReportGenerator} />
    </Switch>
  </Content>
);

_Reports.propTypes = {
  match: PropTypes.shape({url: PropTypes.string}).isRequired,
  theme: PropTypes.object.isRequired
};

export const Reports = withTheme()(_Reports);
