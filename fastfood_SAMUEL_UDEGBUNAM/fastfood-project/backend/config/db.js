const mongoose = require('mongoose');

const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/fastfood';

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
}).then(() => {
  console.log('Connessione a MongoDB avvenuta con successo');
}).catch((err) => {
  console.error('Connessione a MongoDB fallita', err);
  process.exit(1);
});

const db = mongoose.connection;

module.exports = mongoose;