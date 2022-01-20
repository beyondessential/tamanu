const detailsFieldsToDisplay = [
  'firstName',
  'lastName',
  'dateOfBirth',
  'placeOfBirth',
  'countryOfBirthId',
  'sex',
];

const PRIMARY_DETAILS_FIELDS = {
  firstName: null,
  lastName: null,
  placeOfBirth: ({ additionalData }) => additionalData?.placeOfBirth,
  countryOfBirthId: ({ additionalData }) => additionalData?.countryOfBirth?.name,
  sex: null,
  Mother: () => null, // TODO: not populated
  displayId: null,
};

const getHeader = () => `
      <!doctype html>
      <html lang="en"><head>
      <title>Tamanu Certificate</title>
      <meta charSet="UTF-8" >
      <meta
        name="viewport"
        content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0"
      >
      <meta http-equiv="X-UA-Compatible" content="ie=edge" >
      <link
        href="assets/bootstrap-reboot.css"
        rel="stylesheet"
        type="text/css"
      />
      <link href="assets/bootstrap.css" rel="stylesheet" type="text/css" />
      <style>
        /*https://github.com/marcbachmann/node-html-pdf/issues/198*/
        html {
          zoom: .7;
        }  
        .container { 
          padding: 30px;
          border: 1px solid #eee; 
          box-shadow: 0 0 10px rgba(0, 0, 0, .15);
        }
        .header {
            text-align: center;
            margin-bottom: 100px;
        }
        .title {
          font-size: 21px;
        }
        .sub-title {
          font-size: 18px;
        }
         .heading {
          font-size: 16px;
          text-decoration: underline;
          font-weight: 600;
        }
        .header img {
            position: absolute;
            top: 20px;
            left: 20px;
            width: 110px;
        }
        .patient {
            margin-top: 30px;
            margin-bottom: 30px;
        }
        .results {
            margin-top: 30px;
            margin-bottom: 30px;
        }
    
        /* Table*/
        table {
            width: 100%;
            max-width: 100%;
        }
    
        td, th {
            padding: 5px;
        }
    
        th {
            border: 1px solid black;
        }
    
        /* Utils */
        .flex-start {
            display: flex;
            align-items: center;
            justify-content: flex-start;
        }
        .text-center {
            text-align: center;
        }
        .grid {
            display: grid;
            grid-template-columns: auto 1fr;
            grid-column-gap: 20px;
        }
        .grid p {
          border 1px solid lightblue;
        }
      </style>
    </head>
    <body>`;

const getFooter = () => `</body>
    </html>`;

const getBody = ({ patient }) => {
  const patientDetails = detailsFieldsToDisplay
    .map(field => {
      const accessor = PRIMARY_DETAILS_FIELDS[field];
      const label = field;
      const value = (accessor ? accessor(patient) : patient[field]) || '';
      return `<p><span>${label}: </span><span>${value}</span></p>`;
    })
    .join('');

  return `<div class="container" style="width: 21cm; height: 27cm; border: solid 1px black;">
    <div class="header">
      <img src="assets/tamanu_logo.svg" alt="logo">
        <h3 class="title">TAMANU MINISTRY OF HEALTH & MEDICAL SERVICES</h3>
        <h4 class="sub-title">PO Box 12345, Melbourne, Australia</h4>
    </div>
    <div class="patient">
      <h5 class="heading">Covid-19 Test History</h5>
      <div class="grid">
      ${patientDetails}
      </div>
    </div>
    <div class="results">
      <table>
        <thead>
        <tr>
          <th>Date of swab</th>
          <th>Date of test</th>
          <th>Laboratory</th>
          <th>Request ID</th>
        </tr>
        </thead>
        <tbody>
        <tr>
          <td>01/01/2022</td>
          <td>11/01/2022</td>
          <td>Tonga Health Center</td>
          <td>11223344</td>
        </tr>
        </tbody>
      </table>
    </div>
  </div>`;
};

export default data => {
  return `
    ${getHeader()}
    ${getBody(data)}
    ${getFooter()}
    `;
};
