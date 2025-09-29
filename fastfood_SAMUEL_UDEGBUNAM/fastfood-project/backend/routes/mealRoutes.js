const express = require('express');
const Meal = require('../models/Meal');
const router = express.Router();

/**
 * @swagger
 * /api/meals:
 *   get:
 *     summary: Ottieni lista piatti con filtri di ricerca
 *     tags: [Piatti]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Termine di ricerca per il nome del piatto
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           default: 302
 *         description: Limite di risultati
 *     responses:
 *       200:
 *         description: Lista dei piatti
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Meal'
 *       500:
 *         description: Errore nel recupero dei piatti
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
//PIATTI CON FILTRI DI RICERCA
router.get('/', async (req, res) => {
  try {
    const { search = '', limit = 302 } = req.query;
    const query = search ? { nome: { $regex: search, $options: 'i' } } : {};
    const meals = await Meal.find(query).limit(Number(limit));
    res.json(meals);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Errore recupero meals' });
  }
});

/**
 * @swagger
 * /api/meals/{id}:
 *   get:
 *     summary: Ottieni dettagli di un piatto
 *     tags: [Piatti]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del piatto
 *     responses:
 *       200:
 *         description: Dettagli del piatto
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Meal'
 *       404:
 *         description: Piatto non trovato
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Errore nel recupero del piatto
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
//DETTAGLI PIATTO
router.get('/:id', async (req, res) => {
  try {
    const meal = await Meal.findById(req.params.id);
    if (!meal) {
      return res.status(404).json({ msg: 'Meal non trovato' });
    }
    res.json(meal);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Errore recupero meal' });
  }
});

/**
 * @swagger
 * /api/meals/available-categories:
 *   get:
 *     summary: Ottieni categorie di piatti disponibili
 *     tags: [Piatti]
 *     security: []
 *     responses:
 *       200:
 *         description: Lista delle categorie disponibili
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *               description: Array di categorie ordinate alfabeticamente
 *       500:
 *         description: Errore nel recupero delle categorie
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
//CATEGORIE PIATTI DISPONIBILI
router.get('/available-categories', async (req, res) => {
  try {
    const Restaurant = require('../models/Restaurant');
    const rests = await Restaurant.find({}).populate('menu.meal').lean();
    const availableCategories = new Set();
    
    for (const r of (rests || [])) {
      for (const item of (r.menu || [])) {
        if (item?.attivo === false) continue;
        const m = item?.meal;
        if (!m || !m._id) continue;
        
        const category = item.strCategory || m.strCategory || m.category || m.tipologia || '';
        if (category && category.trim()) {
          availableCategories.add(category.trim());
        }
      }
    }
    
    const validCategories = Array.from(availableCategories).sort();
    res.json(validCategories);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Errore recupero categorie' });
  }
});

module.exports = router;
