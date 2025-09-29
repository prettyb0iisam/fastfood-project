const mongoose = require('mongoose');

const mealSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  tipologia: String,
  prezzo: { type: Number, required: true },
  ingredienti: [String],
  ingredients: [String], 
  measures: [String],
  allergeni: [String],
  foto: String,
  isComune: { type: Boolean, default: false },
  creatoDa: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
  strMeal: String,
  strMealThumb: String,
  strCategory: String,
  strArea: String,
  strInstructions: String,
  strTags: [String],
  strYoutube: String,
  strSource: String,
  idMeal: String
});

module.exports = mongoose.model('Meal', mealSchema);

