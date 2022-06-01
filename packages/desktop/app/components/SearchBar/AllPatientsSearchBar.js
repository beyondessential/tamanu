import React, { useMemo, useState, useCallback } from 'react';
import InputAdornment from '@material-ui/core/InputAdornment';
import Tooltip from '@material-ui/core/Tooltip';
import SpellcheckIcon from '@material-ui/icons/Spellcheck';
import moment from 'moment';
import { CustomisableSearchBar } from './CustomisableSearchBar';
import { DateField, AutocompleteField, CheckField, Field } from '../Field';
import { useApi } from '../../api';
import { Suggester } from '../../utils/suggester';
import { FingerprintButton } from '../FingerprintButton';

const DEFAULT_FIELDS = [
  'firstName',
  'lastName',
  'culturalName',
  'villageId',
  'displayId',
  'dateOfBirthFrom',
  'dateOfBirthTo',
  'dateOfBirthExact',
];

export const AllPatientsSearchBar = ({ onSearch }) => {
  // firstName: ['firstName'],
  // lastName: ['lastName'],
  // culturalName: ['culturalName'],
  // villageId: [
  //   'villageId',
  //   { suggester: new Suggester(api, 'village'), component: AutocompleteField },
  // ],
  // displayId: [
  //   'displayId',
  //   {
  //     InputProps: {
  //       endAdornment: (
  //         <InputAdornment position="end">
  //           <Tooltip title="Exact term search">
  //             <SpellcheckIcon
  //               style={{ cursor: 'pointer' }}
  //               aria-label="Exact term search"
  //               onClick={toggleSearchIdExact}
  //               color={displayIdExact ? '' : 'disabled'}
  //             />
  //           </Tooltip>
  //         </InputAdornment>
  //       ),
  //     },
  //   },
  // ],
  // dateOfBirthFrom: [
  //   'dateOfBirthFrom',
  //   { localisationLabel: 'shortLabel', component: DateField },
  // ],
  // dateOfBirthTo: ['dateOfBirthTo', { localisationLabel: 'shortLabel', component: DateField }],
  // dateOfBirthExact: [
  //   'dateOfBirthExact',
  //   { localisationLabel: 'shortLabel', placeholder: 'DOB exact', component: DateField },
  // ],

  return (
    <CustomisableSearchBar
      title="Search for patients"
      RightSection={FingerprintButton}
      renderCheckField={
        <Field name="deceased" label="Include deceased patients" component={CheckField} />
      }
      onSearch={onSearch}
    ></CustomisableSearchBar>
  );
};
