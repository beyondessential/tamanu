export function initWorker(cb) {
  const worker = new Worker("/js/wasmWorker.js");
  worker.onmessage = ({ data: { data, ms } }) => {
    worker.terminate();
    cb(data, ms);
  };
  return worker;
}
