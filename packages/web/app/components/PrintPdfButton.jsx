import React from 'react';

import { BlobProvider } from '@react-pdf/renderer';
import { Button } from './Button';
import PrintIcon from '@material-ui/icons/Print';

// Opens the chrome pdf preview which allows the user to download or print from here. On web this can replace our print previews
export const PrintPdfButton = React.memo(({ pdf, buttonText = "Print" }) => {
    console.log(pdf)
  return (
    <BlobProvider document={pdf}>
      {({ url }) => (
        <Button
          color="primary"
          variant="outlined"
          startIcon={<PrintIcon />}
          size="small"
          href={url}
          target="_blank"
        >
          {buttonText}
        </Button>
      )}
    </BlobProvider>
  );
});
