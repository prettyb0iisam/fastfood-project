const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  cognome: { type: String },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },

  tipo: {
    type: String,
    enum: ['cliente', 'ristoratore'],
    required: true
  },

  metodoPagamento: { type: String },
  preferenze: [{ type: String }],

  nomeRistorante: { type: String },
  numeroTelefono: { type: String },
  partitaIVA: { type: String },
  indirizzoRistorante: { type: String }
});

module.exports = mongoose.model('User', userSchema);
