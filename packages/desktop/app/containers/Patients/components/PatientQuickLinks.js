import React from 'react';
import PropTypes from 'prop-types';
import { QuickLinks } from '../../../components';

const PatientQuickLinks = ({ patient }) => {
  const { _id: patientId } = patient;

  return (
    <QuickLinks
      links={[{
        to: `/appointments/appointmentByPatient/${patientId}`,
        can: { do: 'create', on: 'appointment '},
        text: "Appointment"
      }, {
        to: `/patients/visit/${patientId}`,
        can: { do: 'create', on: 'visit '},
        text: "Visit"
      }, {
        to: `/medication/request/by-patient/${patientId}`,
        can: { do: 'create', on: 'medication '},
        text: "Medication"
      }, {
        to: `/medication/request/by-patient/${patientId}`,
        can: { do: 'create', on: 'imaging '},
        text: "Imaging"
      }, {
        to: `/medication/request/by-patient/${patientId}`,
        can: { do: 'create', on: 'lab '},
        text: "Lab"
      }]} />
  );
};

PatientQuickLinks.propTypes = {
  patient: PropTypes.object.isRequired,
}

export default PatientQuickLinks;