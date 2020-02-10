
import { dropdownItems } from '../Dropdown/fixture';
import { VaccineStatus } from '../../helpers/constants';

export const takenOnTimeProps = {
  vaccine: {
    status: VaccineStatus.TAKEN,
    title: 'BCG',
    subtitle: '(Tuberculosis)',
    dateType: 'Birth',
  },
  fieldOptions: {
    typeOptions: dropdownItems,
    manufactureOptions: dropdownItems,
    administeredOptions: dropdownItems,
  },
  formProps: {
    initialValues: {
      date: null,
      type: null,
      batch: '',
      manufacture: null,
      administered: null,
    },
  },
};

export const takenNotOnScheduleProps = {
  vaccine: {
    status: VaccineStatus.TAKEN_NOT_ON_TIME,
    title: 'BCG',
    subtitle: '(Tuberculosis)',
    dateType: 'Birth',
  },
  fieldOptions: {
    typeOptions: dropdownItems,
    reasonOptions: dropdownItems,
    manufactureOptions: dropdownItems,
    administeredOptions: dropdownItems,
  },
  formProps: {
    initialValues: {
      date: null,
      reason: null,
      type: null,
      batch: '',
      manufacture: null,
      administered: null,
    },
  },
};

export const notTakenProps = {
  vaccine: {
    status: VaccineStatus.NOT_TAKEN,
    title: 'BCG',
    subtitle: '(Tuberculosis)',
    dateType: 'Birth',
  },
  fieldOptions: {
    reasonOptions: dropdownItems,
    administeredOptions: dropdownItems,
  },
  formProps: {
    initialValues: {
      date: null,
      reason: null,
      administered: null,
    },
  },
};
