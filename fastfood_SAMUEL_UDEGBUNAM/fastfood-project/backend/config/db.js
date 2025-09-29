const mongoose = require('mongoose');

const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/fastfood';

console.log('🔗 Tentativo connessione MongoDB...');
console.log('📊 URI configurato:', mongoUri ? 'Sì' : 'No');

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000, // Timeout dopo 5 secondi
  socketTimeoutMS: 45000, // Chiudi socket dopo 45 secondi
}).then(() => {
  console.log('✅ Connessione a MongoDB Effettuata');
}).catch((err) => {
  console.error('❌ Errore connessione MongoDB:', err);
  process.exit(1);
});

const db = mongoose.connection;

db.on('error', (err) => {
  console.error('❌ Connessione a MongoDB Fallita:', err);
  process.exit(1);
});

db.once('open', () => {
  console.log('✅ Database MongoDB connesso e pronto');
});

db.on('disconnected', () => {
  console.log('⚠️ Database MongoDB disconnesso');
});

module.exports = mongoose;