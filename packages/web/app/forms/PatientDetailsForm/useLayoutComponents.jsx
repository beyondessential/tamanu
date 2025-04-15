import {
  GenericPatientFieldLayout,
  GenericPrimaryDetailsLayout,
  GenericSecondaryDetailsLayout,
} from './layouts/generic/GenericLayout';

export const useLayoutComponents = () => {
  return {
    PrimaryDetails: GenericPrimaryDetailsLayout,
    SecondaryDetails: GenericSecondaryDetailsLayout,
    PatientFields: GenericPatientFieldLayout,
  };
};
