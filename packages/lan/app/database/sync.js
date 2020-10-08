import request from 'request';

function sendSyncRequest(channel, body) {
  const token = '123';

  return new Promise((resolve, reject) => {
    request({
      method: 'POST',
      url: `http://localhost:3000/${channel}`,
      headers: {
        'authorization': token,
      },
      json: true,
      body,
    }, (err, response, body) => {
      if(err) reject(err);
      else resolve(body);
    });
  });
}

async function uploadSyncRecords(records) {
  const REQUEST_RECORD_LIMIT = 100;
  const numRequests = records.length / REQUEST_RECORD_LIMIT;

  for(var i = 0; i * REQUEST_RECORD_LIMIT < records.length; ++i) {
    const offset = i * REQUEST_RECORD_LIMIT;
    const items = records
      .slice(offset, offset + REQUEST_RECORD_LIMIT)
      .map(item => ({ 
        recordType: 'referenceData',
        data: item.dataValues
      }));
    const response = await sendSyncRequest('reference', items);
  }
  /*
  const response = await sendSyncRequest('testSync', [
    {
      recordType: 'other', 
      data
    }
  ]);
  console.log(response);
  */
}

export async function startSync({ models }) {
  const records = await models.ReferenceData.findAll({
    order: ["name"],
  });

  await uploadSyncRecords(records);
}
