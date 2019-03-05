import React, { Component } from 'react';
import { TopBar, Button } from '../../components';
import { BrowsableTable } from '../../components/BrowsableTable';
import { ImagingRequestsCollection } from '../../collections';
import { imagingRequestsColumns } from '../../constants';

const setActionsColumn = ({ original: { _id } }) => (
    <div key={_id}>
      <Button
        variant="contained"
        color="primary"
        to={`/imaging/request/${_id}`}
      >View</Button>
    </div>
)

// TODO: move this to redux/actions when connecting up the component 
const transformRow = (imagingModel) => {
  const imagingObject = imagingModel.toJSON();
  const { firstName, lastName } = imagingModel.getPatient();
  const {
    type: { name: typeName },
    requestedBy: { name: requestedBy }
   } = imagingObject;

  return {
    ...imagingObject,
    patientName: `${firstName} ${lastName}`,
    typeName,
    requestedBy,
  };
}

class ImagingRequestsTable extends Component {
  componentWillMount() {
    // set action columns
    imagingRequestsColumns[imagingRequestsColumns.length - 1].Cell = setActionsColumn;
    this.collection = new ImagingRequestsCollection();
  }

  render() {
    return (
      <BrowsableTable
        collection={this.collection}
        columns={imagingRequestsColumns}
        emptyNotification="No requests found"
        transformRow={transformRow}
      />
    );
  }
};

export const Requests = () => (
  <div className="content">
    <TopBar
      title="Imaging Requests"
      button={{
        to: '/imaging/request',
        text: 'New Request',
        can: { do: 'create', on: 'imaging' }
      }}
    />
    <div className="detail">
      <ImagingRequestsTable />
    </div>
  </div>
);

export default Requests;
