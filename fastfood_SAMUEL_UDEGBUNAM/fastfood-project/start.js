// File di avvio per Render
require('dotenv').config();

console.log('🚀 Avvio applicazione FastFood...');
console.log('📊 Variabili d\'ambiente:');
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- PORT:', process.env.PORT);
console.log('- MONGO_URI:', process.env.MONGO_URI ? 'Configurato' : 'Non configurato');
console.log('- SESSION_SECRET:', process.env.SESSION_SECRET ? 'Configurato' : 'Non configurato');

// Avvia il server
require('./backend/server.js');
