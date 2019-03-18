import React from 'react';
import {
  has, isEmpty, set, concat, capitalize, head,
} from 'lodash';
import moment from 'moment';
import {
  pageSizes,
} from '../../constants';
import {
  FETCH_APPOINTMENTS_REQUEST,
  FETCH_APPOINTMENTS_SUCCESS,
  FETCH_APPOINTMENTS_FAILED,
} from '../types';
import { AppointmentsCollection } from '../../collections';

export const fetchAppointments = ({
  page,
  filters = [],
  sorted = [],
  pageSize = pageSizes.appointments,
}) => async dispatch => {
  try {
    dispatch({ type: FETCH_APPOINTMENTS_REQUEST });
    const appointmentsCollection = new AppointmentsCollection({ pageSize });
    // Set pagination options
    if (sorted.length > 0) {
      const sort = head(sorted);
      appointmentsCollection.setSorting(sort.id, sort.desc ? 1 : -1);
    }
    // Fetch results
    await appointmentsCollection.getPage(page, { data: filters });
    const appointments = appointmentsCollection.models.map(object => {
      const { parents } = object;
      let name = '';
      if (has(parents, 'patients') && !isEmpty(parents.patients)) name = set(object.attributes, 'patientsName', `${parents.patients[0].get('firstName')} ${parents.patients[0].get('lastName')}`);
      return { name, ...object.toJSON() };
    });

    dispatch({
      type: FETCH_APPOINTMENTS_SUCCESS,
      appointments,
      totalPages: appointmentsCollection.state.totalPages,
      loading: false,
    });
  } catch (err) {
    dispatch({ type: FETCH_APPOINTMENTS_FAILED, err });
  }
};

export const fetchCalender = ({ filters = {} }) => async dispatch => {
  try {
    dispatch({ type: FETCH_APPOINTMENTS_REQUEST });
    const appointmentsCollection = new AppointmentsCollection();
    await appointmentsCollection.fetchAll({ data: filters });
    const appointments = appointmentsCollection.toJSON().map(({
      _id, startDate, endDate, allDay, patients, location,
    }) => ({
      _id,
      allDay,
      start: moment(startDate).toDate(),
      end: moment(endDate).toDate(),
      title: _getTitle({ patients, location }),
    }));

    dispatch({
      type: FETCH_APPOINTMENTS_SUCCESS,
      appointments,
      totalPages: appointmentsCollection.state.totalPages,
      loading: false,
    });
  } catch (err) {
    dispatch({ type: FETCH_APPOINTMENTS_FAILED, err });
  }
};

const _getTitle = ({ patients, location }) => {
  let patient = '';
  if (!isEmpty(patients) && has(patients[0], 'firstName') && has(patients[0], 'lastName')) {
    patient = `${capitalize(patients[0].firstName)} ${capitalize(patients[0].lastName)}`;
  }

  return (
    <span className="is-size-7">
      {patient}
      {' '}
      {location && <br />}
      {' '}
      {location}
    </span>
  );
};
