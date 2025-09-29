const mongoose = require('mongoose');

const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/fastfood';

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).catch((err) => {
  console.error('Errore connessione MongoDB:', err);
});

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'Connessione a MongoDB Fallita:'));
db.once('open', () => {
  console.log('Connessione a MongoDB Effettuata');
});

module.exports = mongoose;