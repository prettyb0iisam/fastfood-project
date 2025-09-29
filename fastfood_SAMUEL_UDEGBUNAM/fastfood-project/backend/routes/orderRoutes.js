const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const { requireLogin } = require('../middleware/authMiddleware');

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Crea un nuovo ordine
 *     tags: [Ordini]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderNumber
 *               - items
 *             properties:
 *               orderNumber:
 *                 type: string
 *                 description: Numero dell'ordine
 *               items:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/CartItem'
 *                 description: Items da ordinare
 *               preparationTime:
 *                 type: number
 *                 description: Tempo di preparazione stimato in minuti
 *     responses:
 *       201:
 *         description: Ordine creato con successo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 order:
 *                   $ref: '#/components/schemas/Order'
 *       500:
 *         description: Errore nella creazione dell'ordine
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
//CREA UN NUOVO ORDINE
router.post('/', requireLogin, async (req, res) => {
  try {
    const { orderNumber, items, preparationTime } = req.body;
    const totalAmount = items.reduce((sum, item) => sum + (item.price * item.qty), 0);
    
    const order = new Order({
      userId: req.user._id,
      orderNumber,
      items,
      totalAmount,
      preparationTime,
      status: 'confirmed'
    });
    
    await order.save();
    
    res.status(201).json({
      success: true,
      order: order
    });
    
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Errore nella creazione dell\'ordine' 
    });
  }
});

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Ottieni ordini attivi dell'utente
 *     tags: [Ordini]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Lista degli ordini attivi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 orders:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 *       500:
 *         description: Errore nel recupero degli ordini
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
//OTTIENI TUTTI GLI ORDINI DELL'UTENTE
router.get('/', requireLogin, async (req, res) => {
  try {
    const orders = await Order.find({ 
      userId: req.user._id,
      status: { $nin: ['completed', 'cancelled', 'picked_up'] }
    })
    .sort({ createdAt: -1 })
    .limit(50);
    
    res.json({
      success: true,
      orders: orders
    });
    
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Errore nel recupero degli ordini' 
    });
  }
});

/**
 * @swagger
 * /api/orders/completed:
 *   get:
 *     summary: Ottieni ordini completati del cliente
 *     tags: [Ordini]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Lista degli ordini completati
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 orders:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 *       403:
 *         description: Accesso negato per ristoratori
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Errore nel recupero degli ordini completati
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
//OTTIENI ORDINI COMPLETATI DEL CLIENTE
router.get('/completed', requireLogin, async (req, res) => {
  try {
    if (req.user.tipo === 'ristoratore') {
      return res.status(403).json({ 
        success: false, 
        message: 'Accesso negato. I ristoratori devono usare la route /restaurant/completed.' 
      });
    }

    const orders = await Order.find({ 
      userId: req.user._id,
      status: { $in: ['completed', 'cancelled', 'picked_up'] }
    })
    .sort({ updatedAt: -1 })
    .limit(50);
    
    res.json({
      success: true,
      orders: orders
    });
    
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Errore nel recupero degli ordini completati' 
    });
  }
});

/**
 * @swagger
 * /api/orders/{orderId}:
 *   get:
 *     summary: Ottieni un ordine specifico
 *     tags: [Ordini]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID dell'ordine
 *     responses:
 *       200:
 *         description: Dettagli dell'ordine
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 order:
 *                   $ref: '#/components/schemas/Order'
 *       404:
 *         description: Ordine non trovato
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Errore nel recupero dell'ordine
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
//OTTIENI UN ORDINE SPECIFICO
router.get('/:orderId', requireLogin, async (req, res) => {
  try {
    const order = await Order.findOne({ 
      _id: req.params.orderId, 
      userId: req.user._id 
    });
    
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Ordine non trovato' 
      });
    }
    
    res.json({
      success: true,
      order: order
    });
    
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Errore nel recupero dell\'ordine' 
    });
  }
});

/**
 * @swagger
 * /api/orders/{orderId}/status:
 *   put:
 *     summary: Aggiorna lo status di un ordine (cliente)
 *     tags: [Ordini]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID dell'ordine
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [confirmed, preparing, ready, completed, cancelled, picked_up]
 *                 description: Nuovo status dell'ordine
 *     responses:
 *       200:
 *         description: Status aggiornato con successo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 order:
 *                   $ref: '#/components/schemas/Order'
 *       404:
 *         description: Ordine non trovato
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Errore nell'aggiornamento dello status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
//AGGIORNA LO STATUS DI UN ORDINE
router.put('/:orderId/status', requireLogin, async (req, res) => {
  try {
    const { status } = req.body;
    
    const order = await Order.findOneAndUpdate(
      { _id: req.params.orderId, userId: req.user._id },
      { status },
      { new: true }
    );
    
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Ordine non trovato' 
      });
    }
    
    res.json({
      success: true,
      order: order
    });
    
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Errore nell\'aggiornamento dello status' 
    });
  }
});

/**
 * @swagger
 * /api/orders/{orderId}:
 *   delete:
 *     summary: Elimina un ordine completato
 *     tags: [Ordini]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID dell'ordine da eliminare
 *     responses:
 *       200:
 *         description: Ordine eliminato con successo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Puoi eliminare solo ordini completati
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Ordine non trovato
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Errore nell'eliminazione dell'ordine
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
//ELIMINA UN ORDINE
router.delete('/:orderId', requireLogin, async (req, res) => {
  try {
    const order = await Order.findOne({ 
      _id: req.params.orderId, 
      userId: req.user._id 
    });
    
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Ordine non trovato' 
      });
    }
    
    if (order.status !== 'completed') {
      return res.status(400).json({ 
        success: false, 
        message: 'Puoi eliminare solo ordini completati' 
      });
    }
    
    await Order.findByIdAndDelete(req.params.orderId);
    
    res.json({
      success: true,
      message: 'Ordine eliminato con successo'
    });
    
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Errore nell\'eliminazione dell\'ordine' 
    });
  }
});

/**
 * @swagger
 * /api/orders/restaurant/active:
 *   get:
 *     summary: Ottieni ordini attivi per il ristoratore
 *     tags: [Ordini]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Lista degli ordini attivi del ristorante
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 orders:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/Order'
 *                       - type: object
 *                         properties:
 *                           customerName:
 *                             type: string
 *                             description: Nome del cliente
 *       403:
 *         description: Accesso negato. Solo per ristoratori
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Errore nel recupero degli ordini attivi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
//OTTIENI ORDINI ATTIVI PER IL RISTORATORE
router.get('/restaurant/active', requireLogin, async (req, res) => {
  try {
    if (req.user.tipo !== 'ristoratore') {
      return res.status(403).json({ 
        success: false, 
        message: 'Accesso negato. Solo i ristoratori possono visualizzare gli ordini attivi.' 
      });
    }

    const allOrders = await Order.find({
      'items.restaurantName': req.user.nomeRistorante,
      status: { $nin: ['completed', 'cancelled', 'picked_up'] }
    })
    .populate('userId', 'nome cognome')
    .sort({ createdAt: -1 })
    .limit(100);
    
    const ordersWithFilteredItems = allOrders.map(order => {
      const filteredItems = order.items.filter(item => 
        item.restaurantName === req.user.nomeRistorante
      );
      
      const newTotal = filteredItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
      
      return {
        ...order.toObject(),
        items: filteredItems,
        totalAmount: newTotal,
        customerName: order.userId ? `${order.userId.nome} ${order.userId.cognome || ''}`.trim() : 'Cliente'
      };
    });
    
    res.json({
      success: true,
      orders: ordersWithFilteredItems
    });
    
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Errore nel recupero degli ordini attivi' 
    });
  }
});

/**
 * @swagger
 * /api/orders/restaurant/completed:
 *   get:
 *     summary: Ottieni ordini completati per il ristoratore
 *     tags: [Ordini]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Lista degli ordini completati del ristorante
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 orders:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/Order'
 *                       - type: object
 *                         properties:
 *                           customerName:
 *                             type: string
 *                             description: Nome del cliente
 *       403:
 *         description: Accesso negato. Solo per ristoratori
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Errore nel recupero degli ordini completati
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
//ORDINI COMPLETTATI PER IL RISTORANTE
router.get('/restaurant/completed', requireLogin, async (req, res) => {
  try {
    if (req.user.tipo !== 'ristoratore') {
      return res.status(403).json({ 
        success: false, 
        message: 'Accesso negato. Solo i ristoratori possono visualizzare gli ordini completati.' 
      });
    }

    const allOrders = await Order.find({
      'items.restaurantName': req.user.nomeRistorante,
      status: { $in: ['completed', 'cancelled', 'picked_up'] }
    })
    .populate('userId', 'nome cognome')
    .sort({ updatedAt: -1 })
    .limit(100);
    
    const ordersWithFilteredItems = allOrders.map(order => {
      const filteredItems = order.items.filter(item => 
        item.restaurantName === req.user.nomeRistorante
      );

      const newTotal = filteredItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
      
      return {
        ...order.toObject(),
        items: filteredItems,
        totalAmount: newTotal,
        customerName: order.userId ? `${order.userId.nome} ${order.userId.cognome || ''}`.trim() : 'Cliente'
      };
    });
    
    res.json({
      success: true,
      orders: ordersWithFilteredItems
    });
    
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Errore nel recupero degli ordini completati' 
    });
  }
});

/**
 * @swagger
 * /api/orders/{orderId}/confirm-pickup:
 *   put:
 *     summary: Conferma il ritiro dell'ordine
 *     tags: [Ordini]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID dell'ordine
 *     responses:
 *       200:
 *         description: Ritiro confermato con successo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 order:
 *                   $ref: '#/components/schemas/Order'
 *       400:
 *         description: L'ordine deve essere pronto per il ritiro
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Ordine non trovato
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Errore nella conferma del pickup
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
//CONFERMA IL RITIRO DELL'ORDINE
router.put('/:orderId/confirm-pickup', requireLogin, async (req, res) => {
  try {
    const order = await Order.findOne({ 
      _id: req.params.orderId, 
      userId: req.user._id 
    });
    
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Ordine non trovato' 
      });
    }

    if (order.status !== 'ready') {
      return res.status(400).json({ 
        success: false, 
        message: 'L\'ordine deve essere pronto per il ritiro prima di confermare il pickup' 
      });
    }

    order.status = 'picked_up';
    order.updatedAt = new Date();
    await order.save();
    
    res.json({
      success: true,
      order: order
    });
    
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Errore nella conferma del pickup' 
    });
  }
});

/**
 * @swagger
 * /api/orders/{orderId}/restaurant-status:
 *   put:
 *     summary: Aggiorna lo status di un ordine (ristoratore)
 *     tags: [Ordini]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID dell'ordine
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [confirmed, preparing, ready, completed, cancelled, picked_up]
 *                 description: Nuovo status dell'ordine
 *     responses:
 *       200:
 *         description: Status aggiornato con successo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 order:
 *                   $ref: '#/components/schemas/Order'
 *                 message:
 *                   type: string
 *       403:
 *         description: Accesso negato. Solo per ristoratori o ordine non del tuo ristorante
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Ordine o ristorante non trovato
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Errore nell'aggiornamento dello status dell'ordine
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
//AGGIORNA LO STATUS DI UN ORDINE
router.put('/:orderId/restaurant-status', requireLogin, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (req.user.tipo !== 'ristoratore') {
      return res.status(403).json({ 
        success: false, 
        message: 'Accesso negato. Solo i ristoratori possono aggiornare lo status degli ordini.' 
      });
    }

    const order = await Order.findById(req.params.orderId);
    
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Ordine non trovato' 
      });
    }

    const hasRestaurantItems = order.items.some(item => 
      item.restaurantName === req.user.nomeRistorante
    );

    if (!hasRestaurantItems) {
      return res.status(403).json({ 
        success: false, 
        message: 'Accesso negato. Puoi aggiornare solo gli ordini del tuo ristorante.' 
      });
    }

    const Restaurant = require('../models/Restaurant');
    const restaurant = await Restaurant.findOne({ nomeRistorante: req.user.nomeRistorante });
    
    if (!restaurant) {
      return res.status(404).json({ 
        success: false, 
        message: 'Ristorante non trovato' 
      });
    }
    
    const restaurantMealIds = restaurant.menu.map(item => item.meal.toString());
    const restaurantItemIds = restaurant.menu.map(item => item._id.toString());
    
    const hasMenuItems = order.items.some(item => {
      const isInMenu = item.restaurantName === req.user.nomeRistorante && 
                      (restaurantMealIds.includes(item.mealId) || restaurantItemIds.includes(item.itemId));
      return isInMenu;
    });

    if (!hasMenuItems) {
      return res.status(403).json({ 
        success: false, 
        message: 'Accesso negato. Puoi aggiornare solo ordini con piatti presenti nel tuo menu.' 
      });
    }
    
    order.status = status;
    order.updatedAt = new Date();
    await order.save();
    
    let message = 'Status aggiornato con successo';
    if (status === 'completed') {
      message = 'Ordine completato! L\'ordine è stato spostato nello storico.';
    }
    
    res.json({
      success: true,
      order: order,
      message: message
    });
    
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Errore nell\'aggiornamento dello status dell\'ordine' 
    });
  }
});

module.exports = router;
