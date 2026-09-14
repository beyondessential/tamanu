import React, { useEffect, useMemo } from 'react';
import { useGeolocation } from '~/hooks/useGeolocation';
import { TextField } from '../../TextField/TextField';
import { Orientation, screenPercentageToDP } from '~/ui/helpers/screen';
import { StyledText, StyledTouchableOpacity, StyledView } from '~/ui/styled/common';
import { ActivityIndicator, Alert } from 'react-native';
import { Button } from '../../Button';
import { theme } from '~/ui/styled/theme';
import { Geolocate } from '../../Icons/Geolocate';
import styled from 'styled-components';
import { CrossIcon } from '../../Icons';
import { RECOMMENDED_ACCURACY } from '~/constants/comms';
import { TranslatedText } from '../../Translations/TranslatedText';
import { useTranslation } from '~/ui/contexts/TranslationContext';

const EndAdornmentContainer = styled(StyledView)`
  display: flex;
  flex-direction: row;
  align-items: center;
  position: absolute;
  right: ${screenPercentageToDP('1', Orientation.Height)}px;
  bottom: ${screenPercentageToDP('2', Orientation.Height)}px;
  min-height: ${screenPercentageToDP('2.8', Orientation.Height)}px;
`;

const RequestGeolocationArea = styled(StyledTouchableOpacity)`
  position: absolute;
  width: 100%;
  height: 68%;
  bottom: 0;
  left: 0;
`;

const buttonCommonStyles = {
  height: screenPercentageToDP('4.6', Orientation.Height),
  fontSize: screenPercentageToDP('1.45', Orientation.Height),
  fontWeight: 500,
  alignSelf: 'flex-end',
};

export const SurveyGeolocationField = ({ value, onChange, setDisableSubmit, error: formError }) => {
  const { coords, error, isWatching, cancelWatchGeolocation, requestGeolocationPermission } =
    useGeolocation({
      watch: true,
    });
  const { getTranslation } = useTranslation();

  const tempValue = useMemo(() => {
    if (!coords) return '';
    // {}: a hack to remove the empty space
    return getTranslation('program.survey.geolocate.value', ':lat, :long (:accuracy{}m accuracy)', {
      replacements: {
        lat: coords.latitude.toFixed(6),
        long: coords.longitude.toFixed(6),
        accuracy: coords.accuracy,
      },
    }).replace('{}', '');
  }, [coords]);

  useEffect(() => {
    setDisableSubmit(isWatching);
  }, [isWatching]);

  useEffect(() => {
    return () => {
      setDisableSubmit(false);
    };
  }, []);

  const handleRemoveLocation = () => {
    onChange('');
    cancelWatchGeolocation();
  };

  const confirmRemoveLocation = () => {
    Alert.alert(
      getTranslation('program.survey.geolocate.removeLocation.title', 'Remove tagged location?'),
      getTranslation(
        'program.survey.geolocate.removeLocation.description',
        'Are you sure you want to remove the currently selected location?',
      ),
      [
        { text: getTranslation('general.action.keep', 'Keep'), style: 'cancel' },
        {
          text: getTranslation('general.action.remove', 'Remove'),
          style: 'destructive',
          onPress: handleRemoveLocation,
        },
      ],
    );
  };

  const onClickRemoveLocation = () => {
    if (value) {
      confirmRemoveLocation();
    } else {
      cancelWatchGeolocation();
    }
  };

  const handleSaveLocation = () => {
    onChange(tempValue);
    cancelWatchGeolocation();
  };

  const handleCancelLocationSearch = () => {
    cancelWatchGeolocation();
  };

  return (
    <>
      <StyledView>
        <TextField
          label={
            <TranslatedText
              stringId="program.survey.geolocate.label"
              fallback="Latitude, longitude"
            />
          }
          placeholder={
            isWatching
              ? ''
              : getTranslation(
                  'program.survey.geolocate.placeholder',
                  'Tap to detect current location',
                )
          }
          readOnly
          labelFontSize={screenPercentageToDP('1.59', Orientation.Height)}
          fieldFontSize={screenPercentageToDP('1.82', Orientation.Height)}
          value={value || tempValue}
          onChange={() => {}}
          error={formError}
          endAdornment={
            <>
              <EndAdornmentContainer>
                {(tempValue || value) && (
                  <StyledTouchableOpacity
                    onPress={onClickRemoveLocation}
                    marginRight={screenPercentageToDP('8', Orientation.Width)}
                  >
                    <CrossIcon
                      size={screenPercentageToDP('1.6', Orientation.Height)}
                      fill={theme.colors.TEXT_SUPER_DARK}
                    />
                  </StyledTouchableOpacity>
                )}
                {isWatching && (
                  <ActivityIndicator
                    size={screenPercentageToDP('2.8', Orientation.Height)}
                    color={theme.colors.PRIMARY_MAIN}
                  />
                )}
                {!value && !isWatching && (
                  <Geolocate size={screenPercentageToDP('2.6', Orientation.Height)} />
                )}
              </EndAdornmentContainer>
              {!value && !isWatching && (
                <RequestGeolocationArea onPress={requestGeolocationPermission} />
              )}
            </>
          }
        />
        {coords && coords.accuracy < RECOMMENDED_ACCURACY && (
          <Button
            buttonText={
              <TranslatedText
                stringId="program.survey.geolocate.action.saveLocation"
                fallback="Save location"
              />
            }
            backgroundColor={theme.colors.PRIMARY_MAIN}
            marginTop={screenPercentageToDP(-0.5, Orientation.Height)}
            marginBottom={screenPercentageToDP('1', Orientation.Height)}
            width={screenPercentageToDP('12', Orientation.Height)}
            onPress={handleSaveLocation}
            {...buttonCommonStyles}
          />
        )}
        <StyledView>
          {error && (
            <>
              <StyledText
                fontSize={screenPercentageToDP('1.33', Orientation.Height)}
                fontWeight={500}
                color={theme.colors.TEXT_SUPER_DARK}
              >
                <TranslatedText
                  stringId="program.survey.geolocate.error.title"
                  fallback="Location not detectable."
                />
              </StyledText>
              <StyledText
                fontSize={screenPercentageToDP('1.33', Orientation.Height)}
                color={theme.colors.TEXT_SUPER_DARK}
              >
                <TranslatedText
                  stringId="program.survey.geolocate.error.description"
                  fallback="Your location is not detectable. Please stand outside in an open area or check your GPS settings and try again."
                />
              </StyledText>
              <Button
                buttonText={
                  <TranslatedText
                    stringId="program.survey.geolocate.action.cancelLocationSearch"
                    fallback="Cancel location search"
                  />
                }
                outline
                borderColor={theme.colors.PRIMARY_MAIN}
                borderWidth={0.1}
                marginTop={screenPercentageToDP(1, Orientation.Height)}
                width={screenPercentageToDP('20', Orientation.Height)}
                onPress={handleCancelLocationSearch}
                {...buttonCommonStyles}
              />
            </>
          )}
          {coords?.accuracy && coords.accuracy >= RECOMMENDED_ACCURACY && (
            <>
              <StyledText
                fontSize={screenPercentageToDP('1.33', Orientation.Height)}
                fontWeight={500}
                color={theme.colors.TEXT_SUPER_DARK}
              >
                <TranslatedText
                  stringId="program.survey.geolocate.lowAccuracy.title"
                  fallback="Accuracy is low."
                />
              </StyledText>
              <StyledText
                fontSize={screenPercentageToDP('1.33', Orientation.Height)}
                color={theme.colors.TEXT_SUPER_DARK}
              >
                <TranslatedText
                  stringId="program.survey.geolocate.lowAccuracy.description"
                  fallback="Your location accuracy is low and cannot be recorded. To improve accuracy, please stand outside in an open area and retry detecting current location."
                />
              </StyledText>
            </>
          )}
        </StyledView>
      </StyledView>
    </>
  );
};
