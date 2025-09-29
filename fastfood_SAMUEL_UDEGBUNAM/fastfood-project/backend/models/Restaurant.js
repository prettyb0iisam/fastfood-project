const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  meal:        { type: mongoose.Schema.Types.ObjectId, ref: 'Meal', required: true },
  prezzo: { type: Number, default: 0 },
  nome:            { type: String },
  strCategory:     { type: String },
  strArea:         { type: String },
  strInstructions: { type: String },
  strTags:         [{ type: String }],
  ingredients:     [{ type: String }],
  measures:        [{ type: String }],
  youtube:         { type: String },
  source:          { type: String },
  attivo: { type: Boolean, default: true },
}, { timestamps: true });

const restaurantSchema = new mongoose.Schema({
  owners: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  nomeRistorante: String,
  partitaIVA:     String,
  indirizzo:      String,
  numeroTelefono: String,
  menu:           [menuItemSchema],
  createdAt:      { type: Date, default: Date.now }
});

module.exports = mongoose.model('Restaurant', restaurantSchema);
