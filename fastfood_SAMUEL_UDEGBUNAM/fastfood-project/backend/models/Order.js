const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
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

const orderSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  orderNumber: { 
    type: String, 
    required: true, 
    unique: true 
  },
  items: [orderItemSchema],
  status: { 
    type: String, 
    enum: ['confirmed', 'preparing', 'ready', 'picked_up', 'completed', 'cancelled'],
    default: 'confirmed'
  },
  totalAmount: { 
    type: Number, 
    required: true 
  },
  preparationTime: { 
    type: String, 
    default: '' 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

orderSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Order', orderSchema);
