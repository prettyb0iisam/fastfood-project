const express = require('express');
const { requireLogin } = require('../middleware/authMiddleware');
const Restaurant = require('../models/Restaurant');
const Cart = require('../models/Cart');
const router = express.Router();

function nameRegex(s) {
  const trimmed = (s || '').trim().replace(/\s+/g, ' ');
  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^${escaped}$`, 'i');
}

async function getOrCreateCart(userId) {
  let cart = await Cart.findOne({ userId });
  if (!cart) {
    cart = new Cart({ userId, items: [] });
    await cart.save();
  }
  return cart;
}

function computeTotal(items) {
  return items.reduce((sum, it) => sum + (Number(it.price || 0) * Number(it.qty || 1)), 0);
}

router.use(requireLogin);

/**
 * @swagger
 * /api/cart:
 *   get:
 *     summary: Visualizza contenuto carrello
 *     tags: [Carrello]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Contenuto del carrello
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CartItem'
 *                 total:
 *                   type: number
 *                   description: Totale del carrello
 *       500:
 *         description: Errore server
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
//VISUALIZZA CARRELLO
router.get('/', async (req, res) => {
  try {
    const cart = await getOrCreateCart(req.user._id);
    res.json({ items: cart.items, total: computeTotal(cart.items) });
  } catch (e) {
    res.status(500).json({ msg: 'Errore server' });
  }
});

/**
 * @swagger
 * /api/cart/add:
 *   post:
 *     summary: Aggiungi piatto al carrello
 *     tags: [Carrello]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - restaurantName
 *             properties:
 *               restaurantName:
 *                 type: string
 *                 description: Nome del ristorante
 *               itemId:
 *                 type: string
 *                 description: ID dell'item nel menu
 *               mealId:
 *                 type: string
 *                 description: ID del piatto
 *               qty:
 *                 type: number
 *                 description: Quantità da aggiungere
 *                 default: 1
 *     responses:
 *       201:
 *         description: Piatto aggiunto al carrello
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CartItem'
 *                 total:
 *                   type: number
 *       400:
 *         description: Parametri mancanti
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Ristorante o piatto non trovato
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
//AGGIUNTA PIATTO AL CARRELLO
router.post('/add', async (req, res) => {
  try {
    const { restaurantName, itemId, mealId, qty } = req.body || {};
    if (!restaurantName || (!itemId && !mealId)) {
      return res.status(400).json({ msg: 'Parametri mancanti' });
    }

    const r = await Restaurant.findOne({ nomeRistorante: nameRegex(restaurantName) }).populate({
      path: 'menu.meal',
      model: 'Meal'
    });
    if (!r) return res.status(404).json({ msg: 'Ristorante non trovato' });

    let item = null;
    if (itemId) item = r.menu.id(itemId);
    if (!item && mealId) item = (r.menu || []).find(x => String(x.meal?._id || x.meal) === String(mealId));
    if (!item) return res.status(404).json({ msg: 'Piatto non trovato nel menu del ristorante' });

    const meal = item.meal || {};
    const title = item.nome || meal.nome || meal.strMeal || 'Piatto';
    const price = (typeof item.prezzo !== 'undefined') ? Number(item.prezzo) : Number(meal.prezzo || 0);
    const img = meal.foto || meal.image || meal.strMealThumb || '';
    const strMealThumb = meal.strMealThumb || '';
    const strMeal = meal.strMeal || '';
    const quantity = Math.max(1, parseInt(qty, 10) || 1);

    const cart = await getOrCreateCart(req.user._id);
    const existing = cart.items.find(i => i.restaurantName === r.nomeRistorante && String(i.itemId) === String(item._id));
    if (existing) {
      existing.qty += quantity;
      if (!existing.strMealThumb && strMealThumb) existing.strMealThumb = strMealThumb;
      if (!existing.strMeal && strMeal) existing.strMeal = strMeal;
    } else {
      cart.items.push({
        restaurantName: r.nomeRistorante,
        itemId: String(item._id),
        mealId: String(meal._id || ''),
        title,
        price,
        img,
        strMealThumb,
        strMeal,
        qty: quantity
      });
    }
    await cart.save();
    res.status(201).json({ items: cart.items, total: computeTotal(cart.items) });
  } catch (e) {
    res.status(500).json({ msg: 'Errore server' });
  }
});

/**
 * @swagger
 * /api/cart/{index}:
 *   patch:
 *     summary: Aggiorna quantità di un item nel carrello
 *     tags: [Carrello]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: index
 *         required: true
 *         schema:
 *           type: integer
 *         description: Indice dell'item nel carrello
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - qty
 *             properties:
 *               qty:
 *                 type: number
 *                 minimum: 1
 *                 description: Nuova quantità
 *     responses:
 *       200:
 *         description: Quantità aggiornata con successo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CartItem'
 *                 total:
 *                   type: number
 *       404:
 *         description: Voce non trovata
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
//AGGIORNA QUANTITÀ
router.patch('/:index', async (req, res) => {
  try {
    const idx = parseInt(req.params.index, 10);
    const { qty } = req.body || {};
    const cart = await getOrCreateCart(req.user._id);
    if (!(idx >= 0) || !cart.items[idx]) return res.status(404).json({ msg: 'Voce non trovata' });
    const q = Math.max(1, parseInt(qty, 10) || 1);
    cart.items[idx].qty = q;
    await cart.save();
    res.json({ items: cart.items, total: computeTotal(cart.items) });
  } catch (e) {
    res.status(500).json({ msg: 'Errore server' });
  }
});

/**
 * @swagger
 * /api/cart/{index}:
 *   delete:
 *     summary: Rimuovi item dal carrello
 *     tags: [Carrello]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: index
 *         required: true
 *         schema:
 *           type: integer
 *         description: Indice dell'item da rimuovere
 *     responses:
 *       200:
 *         description: Item rimosso con successo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CartItem'
 *                 total:
 *                   type: number
 *       404:
 *         description: Voce non trovata
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
//RIMUOVI PIATTO
router.delete('/:index', async (req, res) => {
  try {
    const idx = parseInt(req.params.index, 10);
    const cart = await getOrCreateCart(req.user._id);
    if (!(idx >= 0) || !cart.items[idx]) return res.status(404).json({ msg: 'Voce non trovata' });
    cart.items.splice(idx, 1);
    await cart.save();
    res.json({ items: cart.items, total: computeTotal(cart.items) });
  } catch (e) {
    res.status(500).json({ msg: 'Errore server' });
  }
});

/**
 * @swagger
 * /api/cart:
 *   delete:
 *     summary: Svuota completamente il carrello
 *     tags: [Carrello]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Carrello svuotato con successo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CartItem'
 *                 total:
 *                   type: number
 *                   description: Totale (sarà 0)
 *       500:
 *         description: Errore server
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
//SVUOTA CARRELLO
router.delete('/', async (req, res) => {
  try {
    const cart = await getOrCreateCart(req.user._id);
    cart.items = [];
    await cart.save();
    res.json({ items: cart.items, total: 0 });
  } catch (e) {
    console.error('DELETE /api/cart error:', e);
    res.status(500).json({ msg: 'Errore server' });
  }
});

/**
 * @swagger
 * /api/cart/migrate:
 *   post:
 *     summary: Migra il carrello dalla sessione al database
 *     tags: [Carrello]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Carrello migrato con successo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CartItem'
 *                 total:
 *                   type: number
 *                 migrated:
 *                   type: number
 *                   description: Numero di items migrati
 *       500:
 *         description: Errore migrazione carrello
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
//SALVA IL CONTENUTO DEL CARRELLO NEL DATABASE
router.post('/migrate', async (req, res) => {
  try {
    if (req.session.cart && req.session.cart.items && req.session.cart.items.length > 0) {
      const cart = await getOrCreateCart(req.user._id);
      
      for (const item of req.session.cart.items) {
        const existing = cart.items.find(i => 
          i.restaurantName === item.restaurantName && 
          String(i.itemId) === String(item.itemId)
        );
        
        if (existing) {
          existing.qty += item.qty;
        } else {
          cart.items.push(item);
        }
      }
      
      await cart.save();
  
      delete req.session.cart;
      
      res.json({ 
        items: cart.items, 
        total: computeTotal(cart.items),
        migrated: req.session.cart.items.length 
      });
    } else {
      res.json({ items: [], total: 0, migrated: 0 });
    }
  } catch (e) {
    res.status(500).json({ msg: 'Errore migrazione carrello' });
  }
});

module.exports = router;