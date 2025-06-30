import { SYNC_STREAM_MESSAGE_KIND } from '@tamanu/constants';

function shape(kind, data) {
  return (
    JSON.stringify({
      kind,
      data,
    }) + '\n'
  );
}

export const StreamMessage = {
  sessionWaiting() {
    return shape(SYNC_STREAM_MESSAGE_KIND.SESSION_WAITING, {});
  },
  pullWaiting() {
    return shape(SYNC_STREAM_MESSAGE_KIND.PULL_WAITING, {});
  },
  pullChange(data) {
    return shape(SYNC_STREAM_MESSAGE_KIND.PULL_CHANGE, data);
  },
  end(data = {}) {
    return shape(SYNC_STREAM_MESSAGE_KIND.END, data);
  },
};
