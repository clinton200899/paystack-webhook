const express = require('express');
const bodyParser = require('body-parser');
const db = require('./utils/db');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());

app.post('/', (req, res) => {
  const event = req.body;

  if (event && event.event === 'charge.success') {
    const ref = event.data.reference;

    db.query('SELECT * FROM orders WHERE payment_ref = ?', [ref], (err, results) => {
      if (err) return res.status(500).send('Database error');

      if (results.length > 0 && results[0].status !== 'Paid') {
        db.query('UPDATE orders SET status = ? WHERE payment_ref = ?', ['Paid', ref], (err2) => {
          if (err2) return res.status(500).send('Update failed');
          return res.status(200).send('Order marked as paid');
        });
      } else {
        return res.status(200).send('Already processed or order not found');
      }
    });
  } else {
    res.status(400).send('Invalid webhook');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Webhook running on port ${PORT}`);
});
