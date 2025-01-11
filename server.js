const express = require('express');
const connectDB = require('./config/db');
const fetchCryptoData = require('./jobs/fetchcryptodata');
const cron = require('node-cron');
require('dotenv').config(); 


const app = express();
const PORT = process.env.PORT || 5000;


app.use(express.json());

connectDB();


app.get('/', (req, res) => {
  res.send('CryptoTracker API is running!');
});

// stats route

app.get('/stats', async (req, res) => {
  const { coin } = req.query;

  if (!coin) {
    return res.status(400).json({ error: "Missing 'coin' query parameter." });
  }

  try {
    const Crypto = require('./models/Crypto'); 
    const crypto = await Crypto.findOne({ name: new RegExp(coin, 'i') }).sort({ lastUpdated: -1 });

    if (!crypto) {
      return res.status(404).json({ error: `No data found for '${coin}'` });
    }

    res.status(200).json({
      price: crypto.price,
      marketCap: crypto.marketCap,
      '24hChange': crypto.change24h,
    });
  } catch (error) {
    console.error('Error fetching stats:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// deviation route
app.get('/deviation', async (req, res) => {
  const { coin } = req.query;

  if (!coin) {
    return res.status(400).json({ error: "Missing 'coin' query parameter." });
  }

  try {
    const Crypto = require('./models/Crypto'); 
    const cryptoRecords = await Crypto.find({ name: new RegExp(coin, 'i') })
      .sort({ lastUpdated: -1 })
      .limit(100);

    if (!cryptoRecords.length) {
      return res.status(404).json({ error: `No data found for '${coin}'` });
    }

    const prices = cryptoRecords.map(record => record.price);
    const mean = prices.reduce((acc, price) => acc + price, 0) / prices.length;

    const variance =
      prices.reduce((acc, price) => acc + Math.pow(price - mean, 2), 0) /
      prices.length;

    const deviation = Math.sqrt(variance);

    res.status(200).json({ deviation: deviation.toFixed(2) });
  } catch (error) {
    console.error('Error calculating deviation:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
});


cron.schedule('0 */2 * * *', async () => {
  console.log('Running scheduled task to fetch cryptocurrency data...');
  await fetchCryptoData();
});


app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
