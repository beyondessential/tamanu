import React from 'react';
import PropTypes from 'prop-types';

import { TopBar } from '../../components/TopBar';

import { availableReports } from './dummyReports';

const ReportGraph = () => <div>Report Graph</div>;
const ReportData = () => <div>Report Data</div>;
const ReportFilters = () => <div>Report Filters</div>;
const ReportViewer = () => (
  <div>
    <ReportGraph />
    <ReportData />
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
        <ReportViewer />
      </div>
    </div>
  );
};
