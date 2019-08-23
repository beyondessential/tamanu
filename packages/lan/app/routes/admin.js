import express from 'express';
import shortid from 'shortid';

export const adminRoutes = express.Router();

adminRoutes.put('/diagnoses', (req, res) => {
  const db = req.app.get('database');
  const items = req.body;

  const codes = db.objects('diagnosis');
  db.write(() => {
    const recordsWritten = items.map(({ code, name, type = "icd10" }) => {
      const existing = codes.filtered('code = $0', code);

      if(existing.length > 0) {
        const existingItem = existing[0];
        if(existingItem.name === name) return null;

        existingItem.name = name;
        return existingItem;
      } 

      const newItem = { 
        _id: shortid(),
        code, 
        name, 
        type,
      };
      db.create('diagnosis', newItem);
      return newItem;
    }).filter(x => x);

    res.send(recordsWritten);
  });

});
