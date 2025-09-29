const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  restaurantName: { type: String, required: true },
  itemId: { type: String, required: true },
  mealId: { type: String, required: true },
  title: { type: String, required: true },
  price: { type: Number, required: true },
  img: { type: String, default: '' },
  strMealThumb: { type: String, default: '' },
  strMeal: { type: String, default: '' },
  qty: { type: Number, default: 1 }
});

const cartSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    unique: true 
  },
  items: [cartItemSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

cartSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Cart', cartSchema);
