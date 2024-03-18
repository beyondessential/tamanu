import React, { FC } from 'react';
import { View } from 'react-native';

import { RowField } from './RowField';
import { StyledView } from '/styled/common';
import { theme } from '/styled/theme';
import { VaccineDataProps } from '.';
import { Orientation, screenPercentageToDP } from '/helpers/screen';
import { formatStringDate } from '../../helpers/date';
import { DateFormats } from '../../helpers/constants';
import { TranslatedText } from '../Translations/TranslatedText';

const GivenOnTimeFields: FC<VaccineDataProps> = ({ administeredVaccine }) => (
  <StyledView
    height={screenPercentageToDP(34.41, Orientation.Height)}
    marginLeft={screenPercentageToDP(2.41, Orientation.Width)}
    marginRight={screenPercentageToDP(2.41, Orientation.Width)}
    background={theme.colors.WHITE}
  >
    <RowField
      label={<TranslatedText stringId="vaccine.form.dateGiven.label" fallback="Date given" />}
      value={
        administeredVaccine.date
          ? formatStringDate(administeredVaccine.date, DateFormats.DDMMYY)
          : null
      }
    />
    <RowField
      label={<TranslatedText stringId="vaccine.form.schedule.label" fallback="Schedule" />}
      value={administeredVaccine.scheduledVaccine?.schedule}
    />
    <RowField
      label={
        <TranslatedText stringId="vaccine.form.batchNumberShorthand.label" fallback="Batch No." />
      }
      value={administeredVaccine.batch}
    />
    <RowField
      label={
        <TranslatedText stringId="vaccine.form.injectionSite.label" fallback="Injection site" />
      }
      value={administeredVaccine.injectionSite}
    />
    {!administeredVaccine.givenElsewhere ? (
      <View>
        <RowField
          label={<TranslatedText stringId="general.form.area.label" fallback="Area" />}
          value={administeredVaccine.location?.locationGroup?.name}
        />
        <RowField
          label={<TranslatedText stringId="general.form.location.label" fallback="Location" />}
          value={administeredVaccine.location?.name}
        />
        <RowField
          label={<TranslatedText stringId="general.form.department.label" fallback="Department" />}
          value={administeredVaccine.department?.name}
        />
      </View>
    ) : null}

    <RowField
      label={
        administeredVaccine.givenElsewhere ? (
          <TranslatedText stringId="vaccine.form.country.label" fallback="Country" />
        ) : (
          <TranslatedText stringId="vaccine.form.givenBy.label" fallback="Given by" />
        )
      }
      value={administeredVaccine.givenBy}
    />
    <RowField
      label={<TranslatedText stringId="vaccine.form.recordedBy.label" fallback="Recorded by" />}
      value={administeredVaccine.encounter?.examiner.displayName}
    />
  </StyledView>
);

export default GivenOnTimeFields;
