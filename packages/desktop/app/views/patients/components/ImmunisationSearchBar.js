import React from 'react';

import { CustomisablePatientSearchBar } from './PatientSearchBar';
import { connectApi } from '../../../api';
import { Suggester } from '../../../utils/suggester';

const DumbImmunisationSearchBar = (props) => (
  <CustomisablePatientSearchBar
    title="Search for patients"
    fields={[
      ['displayId'],
      ['firstName'],
      ['lastName'],
      ['villageName', { suggesterKey: 'villageSuggester', component: AutocompleteField, name: 'villageId' }],
      ['vaccinationStatus'],
    ]}
    {...props}
  />
);

export const ImmunisationSearchBar = connectApi(api => ({
  villageSuggester: new Suggester(api, 'village'),
}))(DumbImmunisationSearchBar);
