import React, { Component } from 'react';
import ReactTable from 'react-table';
import { Button } from '../../../components';
import { patientImagingRequestsColumns } from '../../../constants';

const setActionsColumn = ({ original: { _id } }) => (
  <div key={_id}>
    <Button
      variant="contained"
      color="primary"
      to={`/imaging/request/${_id}`}
    >
View
    </Button>
  </div>
);

const Imaging = ({ patientModel }) => {
  const imagingRequests = patientModel.getImagingRequests();
  // set action columns
  patientImagingRequestsColumns[patientImagingRequestsColumns.length - 1].Cell = setActionsColumn;

  return (
    <div className="column">
      <div className="column">
        {imagingRequests.length > 0
          && (
          <div>
            <ReactTable
              keyField="_id"
              data={imagingRequests}
              pageSize={imagingRequests.length}
              columns={patientImagingRequestsColumns}
              className="-striped"
              defaultSortDirection="asc"
              showPagination={false}
            />
          </div>
          )
        }
        {imagingRequests.length === 0
          && (
          <div className="notification">
            <span>
              No requests found.
            </span>
          </div>
          )
        }
      </div>
    </div>
  );
};

export default Imaging;
