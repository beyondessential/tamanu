export const printFromDataUrl = dataUrl => {
  const oldIframe = document.getElementById('printIframe');
  if (oldIframe) document.body.removeChild(oldIframe);

  const iframe = document.createElement('iframe');
  iframe.id = 'printIframe';
  iframe.style.display = 'none';
  document.body.appendChild(iframe);
  iframe.src = dataUrl;

  iframe.onload = () => {
    iframe.contentWindow.print();
  };
};
