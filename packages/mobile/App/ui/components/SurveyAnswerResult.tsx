import React, { useEffect, useState } from "react";
import { useBackend } from "../hooks";
import { FieldTypes } from "../helpers/fields";
import { getAutocompleteDisplayAnswer } from "../helpers/getAutocompleteDisplayAnswer";
import { Text } from "react-native";

export const SurveyAnswerResult = ({ question, answer }) => {
  const { models } = useBackend();

  const [displayAnswer, setDisplayAnswer] = useState<string>(answer);

  useEffect(() => {
    (async (): Promise<void> => {
      let displayAnswer;
      if (answer && question.config) {
        const config = JSON.parse(question.config);
        const sourceDataElement = await models.ProgramDataElement.findOne({
          where: { code: config.source || config.Source },
        });

        if (sourceDataElement.type === FieldTypes.AUTOCOMPLETE) {
          displayAnswer = await getAutocompleteDisplayAnswer(
            models,
            sourceDataElement.id,
            answer,
          );
        }
        setDisplayAnswer(displayAnswer || answer || '');
      }
    })();
  }, []);

  return <Text>{displayAnswer}</Text>
}
