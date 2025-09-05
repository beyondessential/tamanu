import React, { useEffect, useMemo, useState } from 'react';
import { useGeolocation } from '~/hooks/useGeolocation';
import { TextField } from '../../TextField/TextField';
import { Orientation, screenPercentageToDP } from '~/ui/helpers/screen';
import {
  CenterView,
  RowView,
  StyledText,
  StyledTouchableOpacity,
  StyledView,
} from '~/ui/styled/common';
import { ActivityIndicator, Dimensions, Text } from 'react-native';
import { Button } from '../../Button';
import { theme } from '~/ui/styled/theme';
import { Geolocate } from '../../Icons/Geolocate';
import styled from 'styled-components';
import { CrossIcon } from '../../Icons';
import Modal from 'react-native-modal';
import { RECOMMENDED_ACCURACY } from '~/constants/comms';
import { TranslatedText } from '../../Translations/TranslatedText';
import { useTranslation } from '~/ui/contexts/TranslationContext';

const EndAdornmentContainer = styled(StyledView)`
  display: flex;
  flex-direction: row;
  align-items: center;
  position: absolute;
  right: ${screenPercentageToDP('1', Orientation.Height)};
  bottom: ${screenPercentageToDP('2', Orientation.Height)};
  min-height: ${screenPercentageToDP('2.8', Orientation.Height)};
`;

const ModalContainer = styled(CenterView)`
  background-color: ${theme.colors.BACKGROUND_GREY};
  border-radius: 5;
  max-height: ${screenPercentageToDP('24', Orientation.Height)};
  width: ${screenPercentageToDP('66', Orientation.Width)};
  padding: 20px;
  margin-left: ${screenPercentageToDP('10', Orientation.Width)};
  position: relative;
`;

const ModalTitle = styled(Text)`
  font-size: ${screenPercentageToDP('1.45', Orientation.Height)};
  color: ${theme.colors.BLACK};
  font-weight: bold;
  margin-bottom: 10;
`;

const ModalDescription = styled(Text)`
  font-size: ${screenPercentageToDP('1.45', Orientation.Height)};
  text-align: center;
  color: ${theme.colors.BLACK};
  margin-bottom: 4;
`;

const ModalCloseButton = styled(StyledTouchableOpacity)`
  position: absolute;
  top: ${screenPercentageToDP('1.6', Orientation.Height)};
  right: ${screenPercentageToDP('1.6', Orientation.Height)};
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
  const [showModal, setShowModal] = useState(false);

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
  }, [coords, getTranslation]);

  useEffect(() => {
    setDisableSubmit(isWatching);
  }, [isWatching, setDisableSubmit]);

  useEffect(() => {
    return () => {
      setDisableSubmit(false);
    };
  }, [setDisableSubmit]);

  const onOpenModal = () => setShowModal(true);
  const onCloseModal = () => setShowModal(false);

  const onClickRemoveLocation = () => {
    if (value) {
      onOpenModal();
    } else {
      cancelWatchGeolocation();
    }
  };

  const handleRemoveLocation = () => {
    onChange('');
    cancelWatchGeolocation();
    onCloseModal();
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
      <Modal
        isVisible={showModal}
        onBackdropPress={onCloseModal}
        deviceHeight={Dimensions.get('window').height}
      >
        <ModalContainer>
          <ModalTitle>
            <TranslatedText
              stringId="program.survey.geolocate.removeLocation.title"
              fallback="Remove tagged location?"
            />
          </ModalTitle>
          <ModalDescription>
            <TranslatedText
              stringId="program.survey.geolocate.removeLocation.description"
              fallback="Are you sure you want to remove the currently selected location?"
            />
          </ModalDescription>
          <ModalCloseButton onPress={onCloseModal}>
            <CrossIcon
              size={screenPercentageToDP('1.6', Orientation.Height)}
              fill={theme.colors.TEXT_SUPER_DARK}
            />
          </ModalCloseButton>
          <RowView
            flexDirection="row"
            justifyContent="center"
            gap={screenPercentageToDP('1.5', Orientation.Height)}
            width="95%"
            marginTop={10}
          >
            <Button
              outline
              borderColor={theme.colors.PRIMARY_MAIN}
              borderWidth={0.1}
              buttonText={<TranslatedText stringId="general.action.cancel" fallback="Cancel" />}
              width={screenPercentageToDP('12', Orientation.Height)}
              onPress={onCloseModal}
              {...buttonCommonStyles}
            />
            <Button
              buttonText={<TranslatedText stringId="general.action.confirm" fallback="Confirm" />}
              backgroundColor={theme.colors.PRIMARY_MAIN}
              width={screenPercentageToDP('12', Orientation.Height)}
              onPress={handleRemoveLocation}
              {...buttonCommonStyles}
            />
          </RowView>
        </ModalContainer>
      </Modal>
    </>
  );
};
