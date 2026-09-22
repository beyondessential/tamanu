import { useContext, useEffect, useState } from 'react';
import { LEGACY_PROFILE_PHOTO_QUESTION_CODE } from '@tamanu/constants';
import { BackendContext } from '~/ui/contexts/BackendContext';

// An attachment's contents never change, so once an image has been fetched it can be held for
// the rest of the session. Photos are only bounded by the document size limit, so the cache is
// capped rather than left to grow with every patient browsed. Failures aren't cached: being
// unable to reach the central server is usually temporary.
const MAX_CACHED_IMAGES = 50;
const imagesByAttachmentId = new Map<string, string>();

const rememberImage = (attachmentId: string, uri: string): void => {
  imagesByAttachmentId.delete(attachmentId);
  imagesByAttachmentId.set(attachmentId, uri);
  while (imagesByAttachmentId.size > MAX_CACHED_IMAGES) {
    // Map iterates in insertion order, so this drops the least recently used entry
    const oldest = imagesByAttachmentId.keys().next().value;
    imagesByAttachmentId.delete(oldest);
  }
};

/**
 * Resolves a patient's profile photo to an image URI, or undefined when they have no photo or it
 * can't be loaded. The photo itself is only held on the central server, so this needs a
 * connection the first time a given photo is shown.
 */
export const usePatientProfilePhoto = (patientId?: string): string | undefined => {
  const backend = useContext(BackendContext);
  const [photoUri, setPhotoUri] = useState<string | undefined>();

  useEffect(() => {
    // Clear straight away: this hook instance may be showing the previous patient's photo, and
    // leaving it up would put one patient's face against another's name
    setPhotoUri(undefined);

    if (!patientId) return undefined;

    let isCurrent = true;
    const show = (uri?: string): void => {
      if (isCurrent) setPhotoUri(uri);
    };

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
        LEGACY_PROFILE_PHOTO_QUESTION_CODE,
      );

      // the body of a ProfilePhoto survey answer is an attachment id
      return legacyAnswer?.body || undefined;
    };

    const loadPhoto = async (): Promise<void> => {
      try {
        const attachmentId = await resolveAttachmentId();

        if (!attachmentId) {
          show(undefined);
          return;
        }

        const cached = imagesByAttachmentId.get(attachmentId);
        if (cached) {
          show(cached);
          return;
        }

        const response = (await backend.centralServer.fetch(
          `attachment/${encodeURIComponent(attachmentId)}`,
          { base64: true },
          // The avatar falls back to initials, so one attempt is enough. Retrying would have
          // every patient in a list churning against an unreachable server for minutes.
          { backoff: { maxAttempts: 1 } },
        )) as { data?: string; type?: string };

        if (!response?.data) {
          show(undefined);
          return;
        }

        const uri = `data:${response.type ?? 'image/jpeg'};base64,${response.data}`;
        rememberImage(attachmentId, uri);
        show(uri);
      } catch {
        // leave the avatar on the patient's initials
        show(undefined);
      }
    };

    loadPhoto();

    return () => {
      isCurrent = false;
    };
  }, [patientId, backend]);

  return photoUri;
};
