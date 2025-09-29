const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Meal = require('../models/Meal');

/**
 * @swagger
 * /api/restaurants/{id}/stats:
 *   get:
 *     summary: Ottieni statistiche del ristorante
 *     tags: [Statistiche]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del ristorante
 *     responses:
 *       200:
 *         description: Statistiche del ristorante
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 completedOrders:
 *                   type: number
 *                   description: Numero di ordini completati
 *                 activeOrders:
 *                   type: number
 *                   description: Numero di ordini attivi
 *                 availableMeals:
 *                   type: number
 *                   description: Numero di piatti disponibili nel menu
 *                 averagePrice:
 *                   type: number
 *                   description: Prezzo medio dei piatti
 *       404:
 *         description: Ristorante non trovato
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Errore server
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
//STATISTICHE RISTORANTE
router.get('/:id/stats', async (req, res) => {
  try {
    const restaurantId = req.params.id;
    const Restaurant = require('../models/Restaurant');
    const restaurant = await Restaurant.findById(restaurantId).populate('menu.meal');
    
    if (!restaurant) {
      return res.status(404).json({ message: 'Ristorante non trovato' });
    }

    const restaurantName = restaurant.nomeRistorante;
    const completedOrders = await Order.countDocuments({
      'items.restaurantName': restaurantName,
      'status': { $in: ['completed', 'cancelled', 'picked_up'] }
    });

    const activeOrders = await Order.countDocuments({
      'items.restaurantName': restaurantName,
      'status': { $in: ['confirmed', 'preparing', 'ready'] }
    });

    const availableMeals = restaurant.menu ? restaurant.menu.length : 0;

    let totalPrice = 0;
    let mealCount = 0;
    
    if (restaurant.menu && restaurant.menu.length > 0) {
      restaurant.menu.forEach(menuItem => {
        if (menuItem.prezzo) {
          totalPrice += menuItem.prezzo;
          mealCount++;
        }
      });
    }
    
    const averagePrice = mealCount > 0 ? (totalPrice / mealCount).toFixed(2) : 0;

    const stats = {
      completedOrders,
      activeOrders,
      availableMeals,
      averagePrice: parseFloat(averagePrice)
    };

    res.json(stats);
    
  } catch (error) {
    console.error('Errore nel recupero delle statistiche del ristorante:', error);
    res.status(500).json({ message: 'Errore server' });
  }
});

module.exports = router;
