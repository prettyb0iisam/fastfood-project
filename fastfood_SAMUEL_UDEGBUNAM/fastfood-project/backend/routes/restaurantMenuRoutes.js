const express = require('express');
const { requireLogin, requireRistoratore } = require('../middleware/authMiddleware');
const Restaurant = require('../models/Restaurant');
const Meal = require('../models/Meal');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;

function nameRegex(s) {
  const trimmed = (s || '').trim().replace(/\s+/g, ' ');
  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^${escaped}$`, 'i');
}

//CARICAMENTO IMMAGINI
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = multer.memoryStorage();
const upload = multer({ storage });

function uploadBufferToCloudinary(buffer, folder = 'fastfood') {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder }, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
    stream.end(buffer);
  });
}


//PROTEZIONE 
router.use(requireLogin, requireRistoratore);
router.use((req, res, next) => {
  if (!req.user?.nomeRistorante) {
    return res.status(400).json({ msg: 'Nome ristorante mancante. Aggiorna il profilo del ristoratore.' });
  }
  next();
});

//OGNI RISTORATORE HA UN RISTORANTE ASSOCIATO
async function getOrCreateRestaurantByName(user) {
  let r = await Restaurant.findOne({ nomeRistorante: nameRegex(user.nomeRistorante) });
  if (!r) {
    r = await Restaurant.create({
      owners: [user._id],
      nomeRistorante: user.nomeRistorante,
      menu: []
    });
  }
  return r;
}

/**
 * @swagger
 * /api/my-menu:
 *   get:
 *     summary: Ottieni menu del ristoratore
 *     tags: [Menu Ristoratore]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Menu del ristorante
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/MenuItem'
 *       500:
 *         description: Errore server
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
//MENU RISTORANTE PRIVATO
router.get('/', async (req, res) => {
  try {
    const r = await getOrCreateRestaurantByName(req.user);
    await r.populate('menu.meal');
    res.json(r.menu);
  } catch (err) {
    res.status(500).json({ msg: 'Errore server' });
  }
});

/**
 * @swagger
 * /api/my-menu:
 *   post:
 *     summary: Aggiungi piatto al menu
 *     tags: [Menu Ristoratore]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               custom:
 *                 type: boolean
 *                 description: Se il piatto è personalizzato
 *               mealId:
 *                 type: string
 *                 description: ID del piatto esistente (se non custom)
 *               nome:
 *                 type: string
 *                 description: Nome del piatto
 *               prezzo:
 *                 type: number
 *                 description: Prezzo del piatto
 *               strCategory:
 *                 type: string
 *                 description: Categoria del piatto
 *               strArea:
 *                 type: string
 *                 description: Area di provenienza
 *               strInstructions:
 *                 type: string
 *                 description: Istruzioni di preparazione
 *               strTags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Tag del piatto
 *               ingredients:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Ingredienti
 *               measures:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Misurazioni
 *               youtube:
 *                 type: string
 *                 description: URL video YouTube
 *               source:
 *                 type: string
 *                 description: Fonte della ricetta
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Immagine del piatto
 *     responses:
 *       201:
 *         description: Piatto aggiunto al menu
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/MenuItem'
 *       400:
 *         description: Dati mancanti o piatto già nel menu
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Piatto non trovato
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
//AGGIUNTA-CREZIONE PIATTO AL MENU
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const {
      custom,
      mealId,
      nome,
      prezzo,
      strCategory,
      strArea,
      strInstructions,
      strTags,
      ingredients,
      measures,
      youtube,
      source
    } = req.body;

    const r = await getOrCreateRestaurantByName(req.user);

      if (!custom) {
      if (!mealId) return res.status(400).json({ msg: 'mealId mancante' });
      const meal = await Meal.findById(mealId);
      if (!meal) return res.status(404).json({ msg: 'Meal non trovato' });

      if (r.menu.some(m => String(m.meal) === String(mealId))) {
        return res.status(409).json({ msg: 'Piatto già nel menu' });
      }

      const menuItem = { 
        meal: mealId, 
        nome, 
        prezzo 
      };

      if (Array.isArray(meal.ingredients) && meal.ingredients.length > 0) {
        menuItem.ingredients = meal.ingredients;
      } else if (Array.isArray(meal.ingredienti) && meal.ingredienti.length > 0) {
        menuItem.ingredients = meal.ingredienti;
      }

      if (Array.isArray(meal.measures) && meal.measures.length > 0) {
        menuItem.measures = meal.measures;
      }

      if (meal.strCategory) menuItem.strCategory = meal.strCategory;
      if (meal.strArea) menuItem.strArea = meal.strArea;
      if (meal.strInstructions) menuItem.strInstructions = meal.strInstructions;
      if (Array.isArray(meal.strTags) && meal.strTags.length > 0) {
        menuItem.strTags = meal.strTags;
      } else if (typeof meal.strTags === 'string' && meal.strTags) {
        menuItem.strTags = meal.strTags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      }

      r.menu.push(menuItem);
      await r.save();
      await r.populate('menu.meal');
      return res.status(201).json(r.menu);
    }

    if (!nome || typeof prezzo === 'undefined') {
      return res.status(400).json({ msg: 'Nome e prezzo sono obbligatori' });
    }

    const newMealData = {
      nome,
      prezzo: Number(prezzo),
      creatoDa: req.user._id,
      isComune: false
    };
    if (req.file && req.file.buffer) {
      try {
        const uploaded = await uploadBufferToCloudinary(req.file.buffer, 'fastfood/meals');
        if (uploaded?.secure_url) newMealData.foto = uploaded.secure_url;
      } catch (e) {
        return res.status(500).json({ msg: 'Errore upload immagine' });
      }
    }
    const newMeal = await Meal.create(newMealData);

    const item = {
      meal: newMeal._id,
      nome,
      prezzo: Number(prezzo)
    };
    if (typeof strCategory === 'string') item.strCategory = strCategory.trim();
    if (typeof strArea === 'string') item.strArea = strArea.trim();
    if (typeof strInstructions === 'string') item.strInstructions = strInstructions;
    if (Array.isArray(strTags)) item.strTags = strTags;
    if (Array.isArray(ingredients)) item.ingredients = ingredients;
    if (Array.isArray(measures)) item.measures = measures;
    if (typeof youtube === 'string' && youtube.trim()) item.youtube = youtube.trim();
    if (typeof source === 'string' && source.trim()) item.source = source.trim();

    r.menu.push(item);
    await r.save();
    await r.populate('menu.meal');
    return res.status(201).json(r.menu);
  } catch (err) {
    res.status(500).json({ msg: 'Errore server' });
  }
});

/**
 * @swagger
 * /api/my-menu/{itemId}:
 *   patch:
 *     summary: Modifica piatto nel menu
 *     tags: [Menu Ristoratore]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID dell'item del menu da modificare
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               strMeal:
 *                 type: string
 *                 description: Nome del piatto
 *               prezzo:
 *                 type: number
 *                 description: Prezzo del piatto
 *               strCategory:
 *                 type: string
 *                 description: Categoria del piatto
 *               strArea:
 *                 type: string
 *                 description: Area di provenienza
 *               strInstructions:
 *                 type: string
 *                 description: Istruzioni di preparazione
 *               strTags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Tag del piatto
 *               ingredients:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Ingredienti
 *               measures:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Misurazioni
 *               youtube:
 *                 type: string
 *                 description: URL video YouTube
 *               source:
 *                 type: string
 *                 description: Fonte della ricetta
 *     responses:
 *       200:
 *         description: Piatto modificato con successo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                 item:
 *                   $ref: '#/components/schemas/MenuItem'
 *       404:
 *         description: Item non trovato
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
//MODIFICA PIATTO
router.patch('/:itemId', async (req, res) => {
  try {
    const r = await getOrCreateRestaurantByName(req.user);
    const item = r.menu.id(req.params.itemId);
    if (!item) return res.status(404).json({ msg: 'Item non trovato' });

    const {
      strMeal, prezzo, strCategory, strArea,
      strInstructions, strTags, ingredients, measures,
      youtube, source
    } = req.body;

    if (typeof strMeal === 'string') item.nome = strMeal.trim();
    if (typeof prezzo !== 'undefined') item.prezzo = Number(prezzo);
    if (typeof strCategory === 'string') item.strCategory = strCategory.trim();
    if (typeof strArea === 'string') item.strArea = strArea.trim();
    if (typeof strInstructions === 'string') item.strInstructions = strInstructions;
    if (Array.isArray(strTags)) item.strTags = strTags;
    if (Array.isArray(ingredients)) item.ingredients = ingredients;
    if (Array.isArray(measures)) item.measures = measures;
    if (typeof youtube === 'string') item.youtube = youtube.trim();
    if (typeof source === 'string') item.source = source.trim();

    await r.save();
    return res.json({ ok: true, item });
  } catch (e) {
    res.status(500).json({ msg: 'Errore server' });
  }
});

/**
 * @swagger
 * /api/my-menu/{itemId}:
 *   delete:
 *     summary: Elimina piatto dal menu
 *     tags: [Menu Ristoratore]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID dell'item del menu da eliminare
 *     responses:
 *       204:
 *         description: Piatto eliminato con successo
 *       404:
 *         description: Item non trovato
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
//ELIMINAZIONE PIATTO
router.delete('/:itemId', async (req, res) => {
  try {
    const r = await getOrCreateRestaurantByName(req.user);
    const item = r.menu.id(req.params.itemId);
    if (!item) return res.status(404).json({ msg: 'Item non trovato' });

    await item.deleteOne();
    await r.save();
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ msg: 'Errore server' });
  }
});

module.exports = router;
