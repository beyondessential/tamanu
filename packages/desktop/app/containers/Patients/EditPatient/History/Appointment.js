import React from 'react';
import moment from 'moment';
import { capitalize } from 'lodash';
import { dateFormat } from '../../../../constants';

const Appointment = ({ item, gotoItem }) => (
  <div className="history-pane m-b-25">
    <div className="header" onClick={() => gotoItem('appointment', item)}>
      <span>
      {
        `${moment(item.startDate).format(dateFormat)} ${(item.endDate != null ? ` - ${moment(item.endDate).format(dateFormat)}` : '')}`
      }
      </span>
      {capitalize(item.appointmentType)}
      <span className="has-text-grey-lighter has-background-white-ter is-pulled-right m-r-0">Appointment</span>
    </div>
  </div>
)

export default Appointment;