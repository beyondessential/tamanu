import React from 'react';
import PropTypes from 'prop-types';

import { TopBar } from '../../components/TopBar';

import { availableReports, dummyData } from './dummyReports';
import { ReportViewer } from './ReportViewer';

import DatepickerGroup from '../../components/DatepickerGroup';

const ReportFilters = ({ onUpdateFilter }) => (
  <div>
    <DatepickerGroup name="startDate" label="Start date" />
    <DatepickerGroup name="endDate" label="End date" />
    <hr/>
  </div>
);

const ReportNotFound = ({ missingId }) => (
  <div>
    <TopBar>Report not found</TopBar>
    <div className="detail">
      <div className="notification">
        Could not find report with id "{missingId}".
      </div>
    </div>
  </div>
);

export const ReportGenerator = ({ match }) => {
  const { reportId } = match.params;
  const report = availableReports.find(r => r.id === reportId);

  if(!report) {
    return <ReportNotFound missingId={reportId} />;
  }

  return (
    <div>
      <TopBar>{ report.name }</TopBar>
      <div className="detail">
        <ReportFilters />
        <ReportViewer data={dummyData} />
      </div>
    </div>
  );
};
