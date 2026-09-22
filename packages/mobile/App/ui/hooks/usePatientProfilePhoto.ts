import { useContext, useEffect, useState } from 'react';
import { BackendContext } from '~/ui/contexts/BackendContext';

// An attachment's contents never change, so once an image has been fetched it can be held for
// the rest of the session. Failures aren't cached: being unable to reach the central server is
// usually temporary, and the avatar falls back to the patient's initials in the meantime.
const imagesByAttachmentId = new Map<string, string>();

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

    const loadPhoto = async (): Promise<void> => {
      try {
        // patient additional data uses the patient's id as its own
        const additionalData = await backend.models.PatientAdditionalData.findOne({
          where: { id: patientId },
        });
        const attachmentId = additionalData?.profilePhotoAttachmentId;

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
