import React, { Component } from 'react';

import { TopBar } from '../../components';

import { availableReports, dummyData } from './dummyReports';
import { ReportViewer } from './ReportViewer';
import { ReportFilters } from './ReportFilters';

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

export class ReportGenerator extends Component {

  state = {
    filters: {}
  }

  render() {
    const { match } = this.props;
    const { reportId } = match.params;
    const report = availableReports.find(r => r.id === reportId);

    if(!report) {
      return <ReportNotFound missingId={reportId} />;
    }

    return (
      <div>
        <TopBar title={report.name} />
        <div className="detail">
          <ReportFilters onApply={ filters => this.setState({ filters }) } />
          <hr />
          <ReportViewer
            report={ report }
            data={dummyData}
            filters={ this.state.filters }
          />
        </div>
      </div>
    );
  }
}

