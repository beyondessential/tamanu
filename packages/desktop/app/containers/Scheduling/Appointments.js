import React from 'react';
import moment from 'moment';
import PropTypes from 'prop-types';
import AppointmentsTable from './components/AppointmentsTable';
import { TopBar } from '../../components';
import { REALM_DATE_FORMAT } from '../../constants';

export default function Appointments({ duration, history }) {
  const filters = {
    startDate: `>=|${moment().startOf(duration).format(REALM_DATE_FORMAT)}`,
    endDate: `<=|${moment().endOf(duration).format(REALM_DATE_FORMAT)}`,
  };

  return (
    <div className="content">
      <TopBar
        title={duration === 'day' ? "Today's Appointments" : 'Appointments This Week'}
        buttons={{
          to: '/appointments/appointment/new',
          can: { do: 'create', on: 'appointment' },
          children: 'New Appointment',
        }}
      />
      <AppointmentsTable
        filters={filters}
        history={history}
        autoFetch
      />
    </div>
  );
}

Appointments.propTypes = {
  duration: PropTypes.string,
};

Appointments.defaultProps = {
  duration: 'day',
};
