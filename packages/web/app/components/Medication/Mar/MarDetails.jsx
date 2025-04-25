import React, { useState } from 'react';

import styled from 'styled-components';
import { Box } from '@material-ui/core';
import * as yup from 'yup';
import { FieldArray } from 'formik';
import PriorityHighIcon from '@material-ui/icons/PriorityHigh';
import { IconButton } from '@mui/material';
import { Edit, Add, Remove } from '@material-ui/icons';
import { ADMINISTRATION_STATUS, ADMINISTRATION_STATUS_LABELS } from '@tamanu/constants';
import { Colors, FORM_TYPES } from '../../../constants';
import { Button, OutlinedButton } from '../../Button';
import { MarInfoPane } from './MarInfoPane';
import { TranslatedEnum, TranslatedReferenceData, TranslatedText } from '../../Translation';
import { FormModal } from '../../FormModal';
import { AutocompleteField, CheckField, Field, Form, NumberField } from '../../Field';
import { formatTimeSlot, getDose } from '../../../utils/medications';
import { useTranslation } from '../../../contexts/Translation';
import { ChangeStatusModal } from './ChangeStatusModal';
import { FormGrid } from '../../FormGrid';
import { TimePickerField } from '../../Field/TimePickerField';
import { useSuggester } from '../../../api';
import { useCreateDosesMutation } from '../../../api/mutations/useMarMutation';
import { useQueryClient } from '@tanstack/react-query';
import { useEncounter } from '../../../contexts/Encounter';

const StyledFormModal = styled(FormModal)`
  .MuiPaper-root {
    max-width: 670px;
  }
`;
const Container = styled.div`
  padding: 16px 0px 34px;
`;

const DetailsContainer = styled(Box)`
  padding: 12px 16px;
  border: 1px solid ${Colors.outline};
  border-radius: 3px;
  background-color: ${Colors.white};
  position: relative;
`;

const MidText = styled(Box)`
  font-size: 14px;
  line-height: 18px;
  color: ${Colors.midText};
`;

const DarkText = styled(Box)`
  font-size: 14px;
  line-height: 18px;
  color: ${Colors.darkText};
`;

const DarkestText = styled(Box)`
  font-size: 14px;
  line-height: 18px;
  font-weight: 500;
  color: ${Colors.darkestText};
`;

const StyledPriorityHighIcon = styled(PriorityHighIcon)`
  color: ${Colors.alert};
  font-size: 16px;
`;

const StyledEditButton = styled(IconButton)`
  position: absolute !important;
  right: 10px;
  top: 10px;
  padding: 0 !important;
  background-color: inherit !important;
`;

const StyledEditIcon = styled(Edit)`
  color: ${Colors.primary};
  font-size: 20px;
`;

const HorizontalSeparator = styled.hr`
  border: none;
  border-top: 1px solid ${Colors.outline};
  margin: 14px 0;
`;

const VerticalSeparator = styled.div`
  width: 1px;
  background-color: ${Colors.outline};
  margin: 0 20px;
`;

const StyledAddIcon = styled(Add)`
  color: ${Colors.primary};
  font-size: 18px;
`;

const AddAdditionalDoseButton = styled.a`
  color: ${Colors.primary};
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  height: fit-content;
  padding-top: 14px;
  display: flex;
  align-items: center;

  &:hover {
    text-decoration: underline;
  }
`;

const TimeGivenTitle = styled.div`
  color: ${Colors.darkText};
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 3px;
`;

const RequiredMark = styled.span`
  color: ${Colors.alert};
`;

const ErrorMessage = styled.div`
  color: ${Colors.alert};
  font-size: 12px;
  margin: 4px 2px 2px;
  font-weight: 500;
  line-height: 15px;
`;

const StyledTimePickerField = styled(Field)`
  width: 100%;
  .MuiInputBase-root {
    font-size: 14px;
    color: ${Colors.darkestText};
    background-color: ${Colors.white};
    &.Mui-disabled {
      background-color: inherit;
    }
    &.Mui-disabled .MuiOutlinedInput-notchedOutline {
      border-color: ${Colors.outline};
    }
    .MuiSvgIcon-root {
      font-size: 22px;
    }
    .MuiInputBase-input {
      padding-top: 11.85px;
      padding-bottom: 11.85px;
      text-transform: lowercase;
    }
    .MuiOutlinedInput-notchedOutline {
      border-width: 1px !important;
    }
    &.Mui-focused .MuiOutlinedInput-notchedOutline {
      border-color: ${Colors.primary} !important;
    }
    :not(.Mui-disabled):hover .MuiOutlinedInput-notchedOutline {
      border-color: ${Colors.softText};
    }
  }
`;

const DoseTitle = styled.div`
  color: ${Colors.darkText};
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 14px;
  display: flex;
  justify-content: space-between;
`;

const LinkText = styled.div`
  font-weight: 400;
  font-size: 14px;
  line-height: 18px;
  color: ${Colors.darkestText};
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
`;

export const MarDetails = ({
  medication,
  marInfo,
  onClose,
  timeSlot,
  isFuture,
  isPast,
  selectedDate,
}) => {
  const { getTranslation, getEnumTranslation } = useTranslation();
  const queryClient = useQueryClient();
  const { encounter } = useEncounter();

  const [showChangeStatusModal, setShowChangeStatusModal] = useState(false);
  const [hasChanged, setHasChanged] = useState(false);
  const { mutateAsync: createDoses } = useCreateDosesMutation(marInfo.id, {
    onSuccess: () => {
      queryClient.invalidateQueries(['encounterMedication', encounter?.id]);
      onClose();
    },
  });
  const [currentDoses, setCurrentDoses] = useState(marInfo.doses);

  const handleOpenChangeStatusModal = () => {
    setShowChangeStatusModal(true);
  };

  const handleCloseChangeStatusModal = () => {
    setShowChangeStatusModal(false);
  };

  const onSubmit = async ({ doses }) => {
    const payload = doses.map(d => ({
      ...d,
      givenTime: new Date(d.givenTime),
      marId: marInfo.id,
      doseAmount: Number(d.doseAmount),
    }));

    await createDoses({ doses: payload });
  };

  const practitionerSuggester = useSuggester('practitioner');

  const onRemoveDose = dose => {
    setHasChanged(true);
    setCurrentDoses(currentDoses.filter(d => d.id !== dose.id));
  };

  const requiredMessage = getTranslation('validation.required.inline', '*Required');
  return (
    <>
      <StyledFormModal
        open
        title={
          <TranslatedText
            stringId="medication.mar.details.title"
            fallback="Administration record"
          />
        }
        onClose={onClose}
        isClosable
      >
        <Form
          onSubmit={onSubmit}
          onSuccess={onClose}
          formType={FORM_TYPES.EDIT_FORM}
          initialValues={{}}
          validationSchema={yup.object().shape({
            doses: yup.array().of(
              yup.object().shape({
                doseAmount: yup.number().required(requiredMessage),
                givenTime: yup.string().required(requiredMessage),
                givenByUserId: yup.string().required(requiredMessage),
                recordedByUserId: yup.string().required(requiredMessage),
              }),
            ),
          })}
          render={({ values, setFieldValue, errors, submitForm }) => {
            const allDoses = [...currentDoses, ...(values.doses || [])];
            const showConfirmButton = values?.doses?.length > 0 || hasChanged;

            return (
              <>
                <Container>
                  <MarInfoPane medication={medication} marInfo={marInfo} />
                  <DetailsContainer mt={'14px'} display={'flex'}>
                    <Field
                      label={
                        <Box display={'flex'} alignItems={'center'}>
                          <DarkText>
                            <TranslatedText
                              stringId="medication.mar.markAsMedicationError.label"
                              fallback="Mark as medication error"
                            />
                          </DarkText>
                          <StyledPriorityHighIcon />
                        </Box>
                      }
                      name="markAsMedicationError"
                      component={CheckField}
                    />
                  </DetailsContainer>
                  <DetailsContainer mt={'14px'}>
                    <MidText>
                      <TranslatedText stringId="medication.mar.status" fallback="Status" />
                    </MidText>
                    <DarkestText mt={'3px'}>
                      <TranslatedEnum
                        value={marInfo.status}
                        enumValues={ADMINISTRATION_STATUS_LABELS}
                      />
                    </DarkestText>
                    <StyledEditButton disableRipple onClick={handleOpenChangeStatusModal}>
                      <StyledEditIcon />
                    </StyledEditButton>
                  </DetailsContainer>
                  <HorizontalSeparator />

                  {marInfo.status === ADMINISTRATION_STATUS.GIVEN &&
                    currentDoses.map((dose, index) => (
                      <React.Fragment key={dose.id}>
                        <HorizontalSeparator />
                        {currentDoses.length > 1 && (
                          <DoseTitle>
                            <TranslatedText
                              stringId="mar.details.form.dose.label"
                              fallback="Dose :index"
                              replacements={{ index: index + 1 }}
                            />
                            <LinkText onClick={() => onRemoveDose(dose)}>
                              <Remove fontSize="small" />
                              <TranslatedText
                                stringId="mar.details.action.removeDose"
                                fallback="Remove dose"
                              />
                            </LinkText>
                          </DoseTitle>
                        )}
                        <DetailsContainer display={'flex'}>
                          <Box flex={1}>
                            <MidText>
                              <TranslatedText
                                stringId="medication.mar.doseGiven"
                                fallback="Dose given"
                              />
                            </MidText>
                            <DarkestText mt={'3px'}>
                              {getDose(
                                { ...medication, doseAmount: dose.doseAmount },
                                getTranslation,
                                getEnumTranslation,
                              )}
                            </DarkestText>
                            <MidText mt={'15px'}>
                              <TranslatedText
                                stringId="medication.mar.givenBy"
                                fallback="Given by"
                              />
                            </MidText>
                            <DarkestText mt={'3px'}>{dose?.givenByUser?.displayName}</DarkestText>
                          </Box>
                          <VerticalSeparator />
                          <Box flex={1} mr={2.5}>
                            <MidText>
                              <TranslatedText
                                stringId="medication.mar.timeGiven"
                                fallback="Time given"
                              />
                            </MidText>
                            <DarkestText mt={'3px'}>
                              {formatTimeSlot(new Date(dose.givenTime))}
                            </DarkestText>
                            <MidText mt={'15px'}>
                              <TranslatedText
                                stringId="medication.mar.recordedBy"
                                fallback="Recorded by"
                              />
                            </MidText>
                            <DarkestText mt={'3px'}>
                              {dose?.recordedByUser?.displayName}
                            </DarkestText>
                          </Box>
                          <StyledEditButton disableRipple>
                            <StyledEditIcon />
                          </StyledEditButton>
                        </DetailsContainer>
                      </React.Fragment>
                    ))}
                  {marInfo.status === ADMINISTRATION_STATUS.NOT_GIVEN && (
                    <DetailsContainer display={'flex'}>
                      <Box flex={1}>
                        <MidText>
                          <TranslatedText stringId="medication.mar.reason" fallback="Reason" />
                        </MidText>
                        <DarkestText mt={'3px'}>
                          <TranslatedReferenceData
                            value={marInfo.reasonNotGiven.id}
                            fallback={marInfo.reasonNotGiven.name}
                            category={marInfo.reasonNotGiven.type}
                          />
                        </DarkestText>
                      </Box>
                      <VerticalSeparator />
                      <Box flex={1} mr={2.5}>
                        <MidText>
                          <TranslatedText
                            stringId="medication.mar.recordedBy"
                            fallback="Recorded by"
                          />
                        </MidText>
                        <DarkestText mt={'3px'}>{marInfo?.notGivenRecordedByUser?.displayName}</DarkestText>
                      </Box>
                      <StyledEditButton disableRipple>
                        <StyledEditIcon />
                      </StyledEditButton>
                    </DetailsContainer>
                  )}

                  <FieldArray name="doses">
                    {formArrayMethods => (
                      <>
                        {values?.doses?.map((dose, index) => (
                          <div key={dose.id}>
                            <HorizontalSeparator />
                            <DoseTitle>
                              <TranslatedText
                                stringId="mar.details.form.dose.label"
                                fallback="Dose :index"
                                replacements={{ index: index + currentDoses.length + 1 }}
                              />
                              <LinkText onClick={() => formArrayMethods.remove(index)}>
                                <Remove fontSize="small" />
                                <TranslatedText
                                  stringId="mar.details.action.removeDose"
                                  fallback="Remove dose"
                                />
                              </LinkText>
                            </DoseTitle>
                            <FormGrid>
                              <Field
                                name={`doses.${index}.doseAmount`}
                                component={NumberField}
                                label={`Dose given (${medication?.units})`}
                                required
                              />
                              <div>
                                <TimeGivenTitle>
                                  <TranslatedText
                                    stringId="medication.mar.givenTime.label"
                                    fallback="Time given"
                                  />
                                  <RequiredMark>*</RequiredMark>
                                </TimeGivenTitle>
                                <StyledTimePickerField
                                  name={`doses.${index}.givenTime`}
                                  onChange={value => {
                                    setFieldValue(`doses.${index}.givenTime`, value);
                                  }}
                                  component={TimePickerField}
                                  format="hh:mmaa"
                                  timeSteps={{ minutes: 1 }}
                                  error={errors[`doses.${index}.givenTime`]}
                                  slotProps={{
                                    textField: {
                                      InputProps: {
                                        placeholder: '--:-- --',
                                      },
                                      error: errors[`doses.${index}.givenTime`],
                                    },
                                    digitalClockSectionItem: {
                                      sx: { fontSize: '14px' },
                                    },
                                  }}
                                />
                                {errors[`doses.${index}.givenTime`] && (
                                  <ErrorMessage>{errors[`doses.${index}.givenTime`]}</ErrorMessage>
                                )}
                              </div>
                              <Field
                                name={`doses.${index}.givenByUserId`}
                                component={AutocompleteField}
                                label="Given by"
                                suggester={practitionerSuggester}
                                required
                              />
                              <Field
                                name={`doses.${index}.recordedByUserId`}
                                component={AutocompleteField}
                                label="Recorded by"
                                suggester={practitionerSuggester}
                                required
                              />
                            </FormGrid>
                          </div>
                        ))}
                        {marInfo.status === ADMINISTRATION_STATUS.GIVEN && (
                          <AddAdditionalDoseButton onClick={() => formArrayMethods.push({})}>
                            <StyledAddIcon />
                            <TranslatedText
                              stringId="medication.mar.addAdditionalDose"
                              fallback="Add additional dose"
                            />
                          </AddAdditionalDoseButton>
                        )}
                      </>
                    )}
                  </FieldArray>
                </Container>
                <Box
                  mx={-4}
                  px={5}
                  pt={2.5}
                  borderTop={`1px solid ${Colors.outline}`}
                  display={'flex'}
                  justifyContent={'flex-end'}
                >
                  {!showConfirmButton ? (
                    <Button onClick={onClose}>
                      <TranslatedText stringId="general.action.close" fallback="Close" />
                    </Button>
                  ) : (
                    <Box display={'flex'} style={{ gap: '10px' }}>
                      <OutlinedButton onClick={onClose}>
                        <TranslatedText stringId="general.action.cancel" fallback="Cancel" />
                      </OutlinedButton>
                      <Button onClick={e => submitForm(e, { doses: allDoses })}>
                        <TranslatedText stringId="general.action.confirm" fallback="Confirm" />
                      </Button>
                    </Box>
                  )}
                </Box>
              </>
            );
          }}
        />
      </StyledFormModal>
      <ChangeStatusModal
        open={showChangeStatusModal}
        onClose={handleCloseChangeStatusModal}
        medication={medication}
        marInfo={marInfo}
        timeSlot={timeSlot}
        isFuture={isFuture}
        isPast={isPast}
        selectedDate={selectedDate}
      />
    </>
  );
};
