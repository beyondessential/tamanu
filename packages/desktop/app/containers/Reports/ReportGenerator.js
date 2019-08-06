import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { TopBar } from '../../components';

import { availableReports, dummyData } from './dummyReports';
import { ReportViewer } from './ReportViewer';
import { ReportFilters } from './ReportFilters';

const ReportNotFound = ({ missingId }) => (
  <div>
    <TopBar title="Report not found" />
    <div className="detail">
      <div className="notification">
        {`Could not find report with id ${missingId}.`}
      </div>
    </div>
  </div>
);

ReportNotFound.propTypes = {
  missingId: PropTypes.string.isRequired,
};

export class ReportGenerator extends Component {
  static propTypes = {
    match: PropTypes.shape({ params: PropTypes.object.isRequired }).isRequired,
  }

  state = {
    filters: {},
  };

  updateState = (filters) => {
    this.setState({ filters });
  }

  render() {
    const { match } = this.props;
    const { reportId } = match.params;
    const report = availableReports.find(r => r.id === reportId);

    if (!report) {
      return <ReportNotFound missingId={reportId} />;
    }

    return (
      <div>
        <TopBar title={report.name} />
        <div className="detail">
          <ReportFilters onApply={this.updateState} />
          <hr />
          <ReportViewer report={report} data={dummyData} filters={this.state.filters} />
        </div>
      </div>
    );
  }
}
