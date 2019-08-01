import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Button } from '../../../components';
import { BrowsableTable } from '../../../components/BrowsableTable';
import { ImagingRequestsCollection } from '../../../collections';
import {
  imagingRequestsColumns,
  columnStyle,
  headerStyle,
  IMAGING_REQUEST_STATUSES,
} from '../../../constants';

const getActionsColumn = () => ({
  id: 'actions',
  Header: 'Actions',
  headerStyle,
  style: columnStyle,
  minWidth: 100,
  Cell: props => <ActionsColumn {...props} />,
});

const ActionsColumn = ({ original: { _id } }) => (
  <Button variant="contained" color="primary" to={`/imaging/request/${_id}`}>
    View
  </Button>
);

const transformRow = imagingModel => {
  const imagingObject = imagingModel.toJSON();
  const { firstName, lastName } = imagingModel.getPatient();
  const {
    type: { name: typeName },
    requestedBy: { name: requestedBy },
  } = imagingObject;

  return {
    ...imagingObject,
    patientName: `${firstName} ${lastName}`,
    typeName,
    requestedBy,
  };
};

class ImagingRequestsTable extends Component {
  static propTypes = {
    status: PropTypes.string,
  };

  static defaultProps = {
    status: IMAGING_REQUEST_STATUSES.PENDING,
  };

  componentWillMount() {
    // set action columns
    this.columns = [...imagingRequestsColumns, getActionsColumn()];
    this.collection = new ImagingRequestsCollection();
  }

  render() {
    const { status } = this.props;
    return (
      <BrowsableTable
        collection={this.collection}
        columns={this.columns}
        emptyNotification="No requests found"
        transformRow={transformRow}
        fetchOptions={{ status }}
      />
    );
  }
}

export default ImagingRequestsTable;
