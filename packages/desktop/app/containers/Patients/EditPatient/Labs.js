import React, { Component } from 'react';
import { BrowsableTable } from '../../../components/BrowsableTable';
import { LabTestsCollection } from '../../../collections';

export default class PatientLabResults extends Component {
  
  collection = new LabTestsCollection();

  static columns = [
    { Header: 'Status', accessor: 'status' },
    { Header: 'Type', accessor: 'type.attributes.name' },
    { Header: 'Result', accessor: 'result' },
    { Header: 'Requested by', accessor: 'requestedBy.attributes.displayName' },
    { Header: 'Date', accessor: 'requestedDate' },
  ];

  componentDidMount() {
    const { patientId } = this.props;

    // TODO: filter collection by patient ID
    // collection.setFilter('visit.patient._id', patientId);
  }

  render() {
    return (
      <BrowsableTable
        collection={this.collection}
        columns={PatientLabResults.columns}
        emptyNotification="No requests found"
      />
    );
  }

}

