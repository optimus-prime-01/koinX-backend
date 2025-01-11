// const fetch = require('node-fetch'); 
// fetch operation ko implement karna hai
const Crypto = require('../models/Crypto'); 


const fetchCryptoDetails = async () => {
  const cryptoIds = ['bitcoin', 'matic-network', 'ethereum']; 

  for (const id of cryptoIds) {
    const url = `https://api.coingecko.com/api/v3/coins/${id}`;
    const options = { method: 'GET', headers: { accept: 'application/json' } };

    try {
      const response = await fetch(url, options);
      const data = await response.json();

      
      const cryptoDetails = {
        name: data.name,
        price: data.market_data.current_price.usd,
        marketCap: data.market_data.market_cap.usd,
        change24h: data.market_data.price_change_percentage_24h,
      };

      
      await Crypto.create(cryptoDetails);

      console.log(`Successfully updated ${data.name} details in the database.`);
    } catch (err) {
      console.error(`Error fetching data for ${id}:`, err.message);
    }
  }
};

module.exports = fetchCryptoDetails;
