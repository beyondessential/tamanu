import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useFormikContext } from 'formik';

import { useTranslation } from '../../contexts/Translation';
import { buildLabelText } from '../../utils/medications';

// Label notes that differ from the generated text were written by hand, so are left alone.
export const LabelNotesAutofill = ({ prescription }) => {
  const { values, setFieldValue } = useFormikContext();
  const { getTranslation, getEnumTranslation } = useTranslation();
  const {
    dosingUnit,
    isVariableDose,
    doseAmount,
    frequency,
    route,
    durationValue,
    durationUnit,
    labelNotes,
  } = values;

  const generatedText = buildLabelText(
    {
      ...prescription,
      dosingUnit,
      isVariableDose,
      doseAmount,
      frequency,
      route,
      durationValue,
      durationUnit,
    },
    getTranslation,
    getEnumTranslation,
  );
  const lastGeneratedTextRef = useRef(generatedText);

  useEffect(() => {
    if (generatedText === lastGeneratedTextRef.current) return;
    const isGenerated = labelNotes === lastGeneratedTextRef.current;
    lastGeneratedTextRef.current = generatedText;
    if (isGenerated) setFieldValue('labelNotes', generatedText);
  }, [generatedText, labelNotes, setFieldValue]);

  return null;
};

LabelNotesAutofill.propTypes = {
  prescription: PropTypes.object.isRequired,
};
