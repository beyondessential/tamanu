import React, { ReactElement, FC, useState } from 'react';
import { StyledView, StyledText, StyledTouchableOpacity } from '/styled/common';
import { screenPercentageToDP, Orientation } from '../../helpers/screen';
import { theme } from '../../styled/theme';
import { TextFieldErrorMessage } from '/components/TextField/TextFieldErrorMessage';
import { RequiredIndicator } from '../RequiredIndicator';
import { Button } from '../Button';
import { CrossIcon } from '../Icons';
import { Row } from '~/ui/navigation/screens/home/Tabs/PatientHome/ReportScreen/RecentPatientSurveyReportStyled';

interface ListFieldProps {
  ListItemComponent: FC<{ onChange: (newValue: unknown) => void; value?: unknown }>;
  label?: string;
  values?: unknown[];
  onChange: (newValue: unknown[]) => void;
  onAddAdditional: () => void;
  marginTop?: number;
  error?: string;
  required?: boolean;
}

export const ListField = ({
  label,
  ListItemComponent,
  values = [],
  onChange,
  error,
  required,
}: ListFieldProps): ReactElement => {
  const [listValues, setListValues] = useState(values);
  const addItem = (newValue: unknown) => {
    onChange([...listValues, newValue]);
    setListValues([...listValues, newValue]);
  };
  const editItem = (index) => (newValue: unknown) => {
    const newValues = listValues.map((value, i) => (i === index ? newValue : value));
    onChange(newValues);
    setListValues(newValues);
  };
  const deleteItem = (index) => () => {
    const newValues = listValues.slice(0, index).concat(listValues.slice(index + 1));
    onChange(newValues);
    setListValues(newValues);
  };

  const ListItemWithDeleteButton = ({ value, onChange, onDelete }) => (
    <Row
      style={{
        maxWidth: '100%',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
      }}
    >
      <ListItemComponent value={value} onChange={onChange} />
      <StyledTouchableOpacity onPress={onDelete}>
        <CrossIcon
          fill={theme.colors.TEXT_SUPER_DARK}
          size={screenPercentageToDP(1.9, Orientation.Height)}
        />
      </StyledTouchableOpacity>
    </Row>
  );

  return (
    <StyledView marginBottom={screenPercentageToDP('2.24', Orientation.Height)} width="100%">
      {!!label && (
        <StyledText
          fontSize={14}
          fontWeight={600}
          marginBottom={2}
          color={theme.colors.TEXT_SUPER_DARK}
        >
          {label}
          {required && <RequiredIndicator />}
        </StyledText>
      )}
      {listValues.length < 1 ? (
        <ListItemComponent onChange={addItem} />
      ) : (
        listValues.map((value, index) => (
          <ListItemWithDeleteButton
            key={index}
            value={value}
            onChange={editItem(index)}
            onDelete={deleteItem(index)}
          />
        ))
      )}
      {listValues.length > 0 && (
        <Button
          backgroundColor="transparent"
          textColor={theme.colors.BRIGHT_BLUE}
          buttonText={'+ Add additional'}
          height={'auto'}
          justifyContent="flex-start"
          borderStyle="solid"
          borderWidth={1}
          fontWeight={600}
          fontSize={14}
          onPress={() => addItem(undefined)}
        />
      )}
      {error && <TextFieldErrorMessage>{error}</TextFieldErrorMessage>}
    </StyledView>
  );
};
