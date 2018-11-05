import React from 'react';
import PropTypes from 'prop-types';

import { ReportSelectorButton } from './ReportSelectorButton';

import { TopBar } from '../../components/TopBar';

import { availableReports } from './dummyReports';

export const ReportSelector = ({}) => {
  const reportButtons = availableReports.map(r => (
    <ReportSelectorButton 
      key={ r.id }
      report={ r }
    />
  ));

  return (
    <div>
      <TopBar>Select a report</TopBar>
      <div class="detail">
        { reportButtons } 
      </div>
    </div>
  );
};
