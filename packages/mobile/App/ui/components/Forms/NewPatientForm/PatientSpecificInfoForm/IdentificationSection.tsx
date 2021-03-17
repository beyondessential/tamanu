import React, { ReactElement } from 'react';
import { useField } from 'formik';
import { FormGroup } from '../FormGroup';
import { Field } from '../../FormField';
import { TextField } from '/components/TextField/TextField';
import { screenPercentageToDP, Orientation } from '/helpers/screen';
import { Button } from '/components/Button';
import { theme } from '/styled/theme';
import { StyledView, RowView, StyledText } from '/styled/common';
import { CameraOutlineIcon, FingerprintIcon } from '/components/Icons';
import { imageToBase64URI } from '/helpers/image';
import { ProfileImage } from './ProfileImage';

type IdentificationSectionProps = {
  loadingProfileImage: boolean;
  loadPhoto: () => void;
  loadFingerPrint: () => void;
};

export const IdentificationSection = ({
  loadingProfileImage,
  loadPhoto,
  loadFingerPrint,
}: IdentificationSectionProps): ReactElement => {
  const [profilePhoto, meta] = useField('profilePhoto');
  return (
    <>
      <FormGroup sectionName="IDENTIFICATION" marginTop>
        <Field
          label="License Number"
          name="licenseNumber"
          component={TextField}
        />
      </FormGroup>
      <RowView
        marginTop={screenPercentageToDP(3.64, Orientation.Height)}
        height={screenPercentageToDP(21.87, Orientation.Height)}
      >
        <StyledView flex={1}>
          <Button
            flex={1}
            marginRight={10}
            outline
            flexDirection="column"
            borderColor={theme.colors.BOX_OUTLINE}
            buttonText="ADD PROFILE PHOTO"
            fontSize={screenPercentageToDP(1.57, Orientation.Height)}
            fontWeight="normal"
            textColor={theme.colors.PRIMARY_MAIN}
            onPress={loadPhoto}
          >
            <StyledView
              marginBottom={screenPercentageToDP(1.21, Orientation.Height)}
            >
              {loadingProfileImage || (profilePhoto && profilePhoto.value) ? (
                <ProfileImage
                  loading={loadingProfileImage}
                  uri={imageToBase64URI(profilePhoto.value)}
                />
              ) : (
                <CameraOutlineIcon
                  width={screenPercentageToDP(7.29, Orientation.Height)}
                  height={screenPercentageToDP(7.29, Orientation.Height)}
                  fill={theme.colors.PRIMARY_MAIN}
                />
              )}
            </StyledView>
          </Button>
        </StyledView>
        <Button
          flex={1}
          flexDirection="column"
          outline
          borderColor={theme.colors.BOX_OUTLINE}
          onPress={loadFingerPrint}
          buttonText="ADD FINGER PRINT"
          fontSize={screenPercentageToDP(1.57, Orientation.Height)}
          fontWeight="normal"
          textColor={theme.colors.PRIMARY_MAIN}
        >
          <StyledView
            marginBottom={screenPercentageToDP(1.21, Orientation.Height)}
          >
            <FingerprintIcon
              width={screenPercentageToDP(7.29, Orientation.Height)}
              height={screenPercentageToDP(7.29, Orientation.Height)}
              fill={theme.colors.PRIMARY_MAIN}
            />
          </StyledView>
        </Button>
      </RowView>
      <RowView>
        <StyledView flex={1}>
          {meta.error !== '' && (
            <StyledText color={theme.colors.ALERT} textAlign="center">
              {meta.error}
            </StyledText>
          )}
        </StyledView>
        <StyledView flex={1} />
      </RowView>
    </>
  );
};
