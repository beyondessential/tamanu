import { useContext, useEffect, useState } from 'react';
import { BackendContext } from '~/ui/contexts/BackendContext';

// An attachment's contents never change, so once an image has been fetched it can be held for
// the rest of the session. Failures aren't cached: being unable to reach the central server is
// usually temporary, and the avatar falls back to the patient's initials in the meantime.
const imagesByAttachmentId = new Map<string, string>();

// Photos captured before a patient could hold one on their record live as the answer to a
// survey question conventionally coded like this
const LEGACY_PHOTO_QUESTION_CODE = 'ProfilePhoto';

/**
 * Resolves a patient's profile photo to an image URI, or undefined when they have no photo or it
 * can't be loaded. The photo itself is only held on the central server, so this needs a
 * connection the first time a given photo is shown.
 */
export const usePatientProfilePhoto = (patientId?: string): string | undefined => {
  const backend = useContext(BackendContext);
  const [photoUri, setPhotoUri] = useState<string | undefined>();

  useEffect(() => {
    if (!patientId) {
      setPhotoUri(undefined);
      return undefined;
    }

    let isCurrent = true;

    // Same precedence as the facility server's profile picture endpoint: the photo held on the
    // patient's record, then the most recent ProfilePhoto survey answer for patients who only
    // ever had one of those, and nothing once a photo has been deliberately removed.
    const resolveAttachmentId = async (): Promise<string | undefined> => {
      // patient additional data uses the patient's id as its own
      const additionalData = await backend.models.PatientAdditionalData.findOne({
        where: { id: patientId },
      });

      if (additionalData?.profilePhotoAttachmentId) {
        return additionalData.profilePhotoAttachmentId;
      }

      if (additionalData?.profilePhotoRemoved) {
        return undefined;
      }

      const legacyAnswer = await backend.models.SurveyResponseAnswer.getLatestAnswerForPatient(
        patientId,
        LEGACY_PHOTO_QUESTION_CODE,
      );

      // the body of a ProfilePhoto survey answer is an attachment id
      return legacyAnswer?.body || undefined;
    };

    const loadPhoto = async (): Promise<void> => {
      try {
        const attachmentId = await resolveAttachmentId();

        if (!attachmentId) {
          if (isCurrent) setPhotoUri(undefined);
          return;
        }

        const cached = imagesByAttachmentId.get(attachmentId);
        if (cached) {
          if (isCurrent) setPhotoUri(cached);
          return;
        }

        const response = (await backend.centralServer.fetch(`attachment/${attachmentId}`, {
          base64: true,
        })) as { data?: string; type?: string };

        if (!response?.data) return;

        const uri = `data:${response.type ?? 'image/jpeg'};base64,${response.data}`;
        imagesByAttachmentId.set(attachmentId, uri);
        if (isCurrent) setPhotoUri(uri);
      } catch {
        // leave the avatar on the patient's initials
      }
    };

    loadPhoto();

    return () => {
      isCurrent = false;
    };
  }, [patientId, backend]);

  return photoUri;
};
