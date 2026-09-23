import { useQuery } from '@tanstack/react-query';
import { LEGACY_PROFILE_PHOTO_QUESTION_CODE } from '@tamanu/constants';
import { useBackend } from '~/ui/hooks';
import { patientKeys } from './queries/queryKeys';

// A photo is only held on the central server, so resolving one costs a round trip. Keyed on the
// patient, react-query dedupes the many rows of a list asking at once and remembers the answer —
// including "this patient has no photo", which is the common case and would otherwise repeat two
// queries on every remount of an unvirtualised list. Cached entries are whole images, so they are
// held for minutes rather than the rest of the session.
const PHOTO_CACHE_TIME = 1000 * 60 * 5;

// Patient lists aren't virtualised, so every row mounts at once and asks for its photo. Without
// a bound that is one central-server round trip per row, each carrying a whole image.
const MAX_CONCURRENT_PHOTO_FETCHES = 4;
let activePhotoFetches = 0;
const waitingForFetchSlot: Array<() => void> = [];

const withFetchSlot = async <T>(fetchPhoto: () => Promise<T>): Promise<T> => {
  if (activePhotoFetches >= MAX_CONCURRENT_PHOTO_FETCHES) {
    await new Promise<void>(resolve => {
      waitingForFetchSlot.push(resolve);
    });
  }
  activePhotoFetches += 1;
  try {
    return await fetchPhoto();
  } finally {
    activePhotoFetches -= 1;
    waitingForFetchSlot.shift()?.();
  }
};

/**
 * Resolves a patient's profile photo to an image URI, or undefined when they have no photo or it
 * can't be loaded. The photo itself is only held on the central server, so this needs a
 * connection the first time a given photo is shown.
 */
export const usePatientProfilePhoto = (patientId?: string): string | undefined => {
  const backend = useBackend();

  // Same precedence as the facility server's profile picture endpoint: the photo held on the
  // patient's record, then the most recent ProfilePhoto survey answer for patients who only ever
  // had one of those, and nothing once a photo has been deliberately removed.
  const resolveAttachmentId = async (): Promise<string | undefined> => {
    // patient additional data uses the patient's id as its own
    const additionalData = await backend.models.PatientAdditionalData.findOne({
      where: { id: patientId },
      // the model eagerly joins its reference-data relations, which is a lot of work for two
      // scalar columns once per row of a patient list
      select: ['profilePhotoAttachmentId', 'profilePhotoRemoved'],
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

  const loadPhoto = async (): Promise<string | null> => {
    const attachmentId = await resolveAttachmentId();
    if (!attachmentId) return null;

    const response = (await withFetchSlot(() =>
      backend.centralServer.fetch(
        `attachment/${encodeURIComponent(attachmentId)}`,
        { base64: true },
        // The avatar falls back to initials, so one attempt is enough. Retrying would have every
        // patient in a list churning against an unreachable server for minutes.
        { backoff: { maxAttempts: 1 } },
      ),
    )) as { data?: string; type?: string };

    if (!response?.data) return null;
    return `data:${response.type ?? 'image/jpeg'};base64,${response.data}`;
  };

  const { data } = useQuery({
    queryKey: patientKeys.profilePhoto(patientId),
    queryFn: loadPhoto,
    enabled: Boolean(patientId),
    // an attachment's contents never change, so a resolved photo stays good
    staleTime: PHOTO_CACHE_TIME,
    gcTime: PHOTO_CACHE_TIME,
    // being unable to reach the central server just means initials for now
    retry: false,
  });

  return data ?? undefined;
};
