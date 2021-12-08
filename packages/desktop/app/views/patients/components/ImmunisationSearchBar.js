import React from 'react';

import { CustomisablePatientSearchBar } from './PatientSearchBar';
import { useApi } from '../../../api';
import { Suggester } from '../../../utils/suggester';
import { AutocompleteField } from '../../../components';

export const ImmunisationSearchBar = props => {
  const api = useApi();
  return (
    <CustomisablePatientSearchBar
      title="Search for patients"
      fields={[
        ['displayId'],
        ['firstName'],
        ['lastName'],
        ['villageId', { suggester: new Suggester(api, 'village'), component: AutocompleteField }],
        ['vaccinationStatus'],
      ]}
      {...props}
    />
  );
};
