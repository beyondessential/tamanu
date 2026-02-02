import React, { FC } from 'react';
import { View } from 'react-native';

import { RowField } from './RowField';
import { StyledView } from '/styled/common';
import { theme } from '/styled/theme';
import { VaccineDataProps } from '.';
import { Orientation, screenPercentageToDP } from '/helpers/screen';
import { TranslatedText } from '../Translations/TranslatedText';
import { TranslatedReferenceData } from '../Translations/TranslatedReferenceData';
import { TranslatedEnum } from '../Translations/TranslatedEnum';
import { INJECTION_SITE_LABELS } from '@tamanu/constants';
import { useDateTimeFormat } from '~/ui/contexts/DateTimeContext';

const GivenOnTimeFields: FC<VaccineDataProps> = ({ administeredVaccine }) => {
  const { formatShort } = useDateTimeFormat();

  return (
  <StyledView
    height={screenPercentageToDP(34.41, Orientation.Height)}
    marginLeft={screenPercentageToDP(2.41, Orientation.Width)}
    marginRight={screenPercentageToDP(2.41, Orientation.Width)}
    background={theme.colors.WHITE}
  >
    <RowField
      label={<TranslatedText stringId="vaccine.form.dateGiven.label" fallback="Date given" />}
      value={administeredVaccine.date ? formatShort(administeredVaccine.date) : null}
    />
    <RowField
      label={<TranslatedText stringId="vaccine.form.schedule.label" fallback="Schedule" />}
      value={administeredVaccine.scheduledVaccine?.doseLabel}
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
      value={<TranslatedEnum value={administeredVaccine.injectionSite} enumValues={INJECTION_SITE_LABELS} />}
    />
    {!administeredVaccine.givenElsewhere ? (
      <View>
        <RowField
          label={<TranslatedText stringId="general.form.area.label" fallback="Area" />}
          value={
            <TranslatedReferenceData
              fallback={administeredVaccine.location?.locationGroup?.name}
              value={administeredVaccine.location?.locationGroup?.id}
              category="locationGroup"
            />
          }
        />
        <RowField
          label={<TranslatedText stringId="general.form.location.label" fallback="Location" />}
          value={
            <TranslatedReferenceData
              fallback={administeredVaccine.location?.name}
              value={administeredVaccine.location?.id}
              category="location"
            />
          }
        />
        <RowField
          label={<TranslatedText stringId="general.form.department.label" fallback="Department" />}
          value={
            <TranslatedReferenceData
              fallback={administeredVaccine.department?.name}
              value={administeredVaccine.department?.id}
              category="department"
            />
          }
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
};

export default GivenOnTimeFields;
