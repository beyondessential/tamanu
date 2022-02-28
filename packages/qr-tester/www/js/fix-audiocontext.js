////////////////////////
// Fix iOS AudioContext
////////////////////////
window.AudioContext = window.AudioContext || window.webkitAudioContext;
if (window.AudioContext) {
  window.audioContext = new window.AudioContext();
}
const fixAudioContext = function (e) {
  if (window.audioContext) {
    // Create empty buffer
    const buffer = window.audioContext.createBuffer(1, 1, 22050);
    const source = window.audioContext.createBufferSource();
    source.buffer = buffer;
    // Connect to output (speakers)
    source.connect(window.audioContext.destination);
    // Play sound
    if (source.start) {
      source.start(0);
    } else if (source.play) {
      source.play(0);
    } else if (source.noteOn) {
      source.noteOn(0);
    }
  }
  // Remove events
  document.removeEventListener('touchstart', fixAudioContext);
  document.removeEventListener('touchend', fixAudioContext);
};
// iOS 6-8
document.addEventListener('touchstart', fixAudioContext);
// iOS 9
document.addEventListener('touchend', fixAudioContext);


