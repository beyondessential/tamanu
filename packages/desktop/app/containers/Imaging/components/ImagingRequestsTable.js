import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Button } from '../../../components';
import { BrowsableTable } from '../../../components/BrowsableTable';
import { ImagingRequestsCollection } from '../../../collections';
import { imagingRequestsColumns, IMAGING_REQUEST_STATUSES } from '../../../constants';

const setActionsColumn = ({ original: { _id } }) => (
    <div key={_id}>
      <Button
        variant="contained"
        color="primary"
        to={`/imaging/request/${_id}`}
      >View</Button>
    </div>
)

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
  static propTypes = {
    status: PropTypes.string,
  }

  static defaultProps = {
    status: IMAGING_REQUEST_STATUSES.PENDING,
  }

  componentWillMount() {
    // set action columns
    imagingRequestsColumns[imagingRequestsColumns.length - 1].Cell = setActionsColumn;
    this.collection = new ImagingRequestsCollection();
  }

  render() {
    const { status } = this.props;

    return (
      <BrowsableTable
        collection={this.collection}
        columns={imagingRequestsColumns}
        emptyNotification="No requests found"
        transformRow={transformRow}
        fetchOptions={{ data: { status } }}
      />
    );
  }
};

export default ImagingRequestsTable;
