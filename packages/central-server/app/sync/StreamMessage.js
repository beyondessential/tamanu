export const StreamMessageKind = {
  SESSION_WAITING: 'SESSION_WAITING',
  SESSION_READY: 'SESSION_READY',
  PULL_WAITING: 'PULL_WAITING',
  PULL_READY: 'PULL_READY',
  PULL_CHANGE: 'PULL_CHANGE',
  END: 'END',
};

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
    return shape(StreamMessageKind.SESSION_WAITING, {});
  },
  pullWaiting() {
    return shape(StreamMessageKind.PULL_WAITING, {});
  },
  pullChange(data) {
    return shape(StreamMessageKind.PULL_CHANGE, data);
  },
  end(data = {}) {
    return shape(StreamMessageKind.END, data);
  },
};
