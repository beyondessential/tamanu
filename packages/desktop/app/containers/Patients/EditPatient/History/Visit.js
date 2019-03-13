import React, { Fragment } from 'react';
import moment from 'moment';
import { capitalize } from 'lodash';
import { Link } from 'react-router-dom';
import { dateFormat } from '../../../../constants';

const Procedures = ({ _id: visitId, procedures, patientModel }) => (
  <div className="text">
    {procedures.map(procedure => (
      <Fragment key={`procedure-${procedure._id}`}>
        <span>Procedure</span><br />
        <Link to={`/patients/visit/${patientModel.id}/${visitId}/procedure/${procedure._id}`}>
          {`${moment(procedure).format(dateFormat)}: ${procedure.description}`}
        </Link>
      </Fragment>
    ))}
  </div>
)

const Visit = ({ item: visit, gotoItem, patientModel }) => (
  <div className="history-pane m-b-25">
    <div className="header" onClick={() => gotoItem('visit', visit)}>
      <span>
      {
        `${moment(visit.startDate).format(dateFormat)} ${(visit.endDate != null ? ` - ${moment(visit.endDate).format(dateFormat)}` : '')}`
      }
      </span>
      {capitalize(visit.visitType)}
      <span className="has-text-grey-lighter has-background-white-ter is-pulled-right m-r-0">Visit</span>
    </div>
    {!!visit.procedures.length &&
      <Procedures
        {...visit}
        patientModel={patientModel}
      />
    }
  </div>
)

export default Visit;