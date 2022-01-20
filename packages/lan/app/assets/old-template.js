export default () => {
  const today = new Date();
  const firstName = 'Tom';
  const receiptId = '123';
  const price1 = '11';
  const price2 = '12';

  return `
    <!doctype html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport"
            content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0">
      <meta http-equiv="X-UA-Compatible" content="ie=edge">
      <title>Tamanu Certificate</title>
      <link href="assets/bootstrap-reboot.css" rel="stylesheet" type="text/css" />
      <link href="assets/bootstrap.css" rel="stylesheet" type="text/css" />
      <style>
        .container1 { 
          padding: 30px;
          max-width: 100%;
          margin: auto;
          border: 1px solid #eee;
          box-shadow: 0 0 10px rgba(0, 0, 0, .15);
        }
        .header1 {
            text-align: center;
            margin-bottom: 100px;
        }
        .header1 img {
            position: absolute;
            top: 30px;
            left: 80px;
            width: 126px;
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
        .grid1 {
            display: grid;
            grid-template-columns: auto 1fr;
            grid-column-gap: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container1">
        <div class="header1">
            <img src="assets/tamanu_logo.svg" alt="logo" >
            <h3>TAMANU MINISTRY OF HEALTH & MEDICAL SERVICES</h3> 
            <h4>PO Box 12345, Melbourne, Australia ${__dirname}/assets/</h4>
        </div>
        <div class="patient">
          <h5>Covid-19 Test History</h5>
          <div class="grid1">
            <p>
              <span>First name: </span><span>${firstName}</span>
            </p>
            <p>
              <span>Last name: </span><span>Adam</span>
            </p>
            <p>
              <span>DOB: </span><span>18th Feb 2003</span>
            </p>
            <p>
              <span>Place of birth: </span><span>New Zealand</span>
            </p>
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
      </div>
    </body>
    </html>
    `;
};
