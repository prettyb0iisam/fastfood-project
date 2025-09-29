const express = require('express');
const Restaurant = require('../models/Restaurant');
const router = express.Router();

function nameRegex(s){
  const t=(s||'').trim().replace(/\s+/g,' ');
  const e=t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  return new RegExp(`^${e}$`,'i');
}

/**
 * @swagger
 * /api/menu/{restaurantName}:
 *   get:
 *     summary: Ottieni menu di un ristorante
 *     tags: [Menu Pubblico]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: restaurantName
 *         required: true
 *         schema:
 *           type: string
 *         description: Nome del ristorante
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
//MENU DI UN RISTORANTE
router.get('/menu/:restaurantName', async (req, res) => {
  try {
    const r = await Restaurant.findOne({
      nomeRistorante: nameRegex(req.params.restaurantName)
    }).populate('menu.meal');

    if (!r) return res.json([]);
    res.json(r.menu || []);
  } catch (e) {
    console.error(e);
    res.status(500).json({ msg: 'Errore server' });
  }
});

/**
 * @swagger
 * /api/open-restaurants:
 *   get:
 *     summary: Ottieni lista ristoranti disponibili
 *     tags: [Menu Pubblico]
 *     security: []
 *     responses:
 *       200:
 *         description: Lista dei ristoranti
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   nomeRistorante:
 *                     type: string
 *                   indirizzo:
 *                     type: string
 *                   numeroTelefono:
 *                     type: string
 *                   partitaIVA:
 *                     type: string
 *       500:
 *         description: Errore server
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
//RISTORANTI APERTI
router.get('/open-restaurants', async (req, res) => {
  try {
    const list = await Restaurant.find({}, 'nomeRistorante indirizzo numeroTelefono partitaIVA').lean();
    res.json(list || []);
  } catch (e) {
    console.error('GET /open-restaurants', e);
    res.status(500).json({ msg: 'Errore server' });
  }
});

/**
 * @swagger
 * /api/available-meals:
 *   get:
 *     summary: Ottieni tutti i piatti disponibili nei ristoranti
 *     tags: [Menu Pubblico]
 *     security: []
 *     responses:
 *       200:
 *         description: Lista di tutti i piatti disponibili
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   mealId:
 *                     type: string
 *                     description: ID del piatto
 *                   title:
 *                     type: string
 *                     description: Nome del piatto
 *                   image:
 *                     type: string
 *                     description: URL dell'immagine
 *                   category:
 *                     type: string
 *                     description: Categoria del piatto
 *                   area:
 *                     type: string
 *                     description: Area di provenienza
 *                   instructions:
 *                     type: string
 *                     description: Istruzioni di preparazione
 *                   tags:
 *                     type: array
 *                     items:
 *                       type: string
 *                     description: Tag del piatto
 *                   ingredients:
 *                     type: array
 *                     items:
 *                       type: string
 *                     description: Ingredienti
 *                   measures:
 *                     type: array
 *                     items:
 *                       type: string
 *                     description: Misurazioni
 *                   youtube:
 *                     type: string
 *                     description: URL video YouTube
 *                   source:
 *                     type: string
 *                     description: Fonte della ricetta
 *                   restaurants:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         restaurantId:
 *                           type: string
 *                         restaurantName:
 *                           type: string
 *                         itemId:
 *                           type: string
 *                         prezzo:
 *                           type: number
 *       500:
 *         description: Errore server
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
//PIATTI DISPONIBILI
router.get('/available-meals', async (req, res) => {
  try {
    const rests = await Restaurant.find({}).populate('menu.meal').lean();
    const result = [];

    for (const r of (rests || [])) {
      for (const item of (r.menu || [])) {
        if (item?.attivo === false) continue;
        const m = item?.meal;
        if (!m || !m._id) continue;
        const mid = String(m._id);
        const category = item.strCategory || m.strCategory || m.category || m.tipologia || '';
        const area = item.strArea || m.strArea || m.area || '';
        const instructions = item.strInstructions || m.strInstructions || m.instructions || '';
        let tags;
        if (Array.isArray(item.strTags)) {
          tags = item.strTags;
        } else if (Array.isArray(m.strTags)) {
          tags = m.strTags;
        } else if (typeof m.strTags === 'string') {
          tags = m.strTags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
        } else {
          tags = (m.tags || []).filter(Boolean);
        }
        
        let ingredients = [];
        if (Array.isArray(item.ingredients)) {
          ingredients = item.ingredients;
        } else if (Array.isArray(m.ingredients) && m.ingredients.length > 0) {
          ingredients = m.ingredients;
        } else if (Array.isArray(m.ingredienti) && m.ingredienti.length > 0) {
          ingredients = m.ingredienti;
        }
        ingredients = ingredients.filter(Boolean);
        let measures = [];
        if (Array.isArray(item.measures)) {
          measures = item.measures;
        } else if (Array.isArray(m.measures) && m.measures.length > 0) {
          measures = m.measures;
        }
        measures = measures.filter(Boolean);

        let youtube = '';
        if (item.hasOwnProperty('youtube')) {
          youtube = item.youtube || '';
        } else {
          youtube = m.strYoutube || m.youtube || '';
        }

        let source = '';
        if (item.hasOwnProperty('source')) {
          source = item.source || '';
        } else {
          source = m.strSource || m.source || m.url || '';
        }

        const entry = {
          mealId: mid,
          title: item.nome || m.nome || m.strMeal || 'Piatto',
          image: m.foto || m.image || m.strMealThumb || '',
          category,
          area,
          instructions,
          tags,
          ingredients,
          measures,
          youtube,
          source,
          restaurants: [{
            restaurantId: String(r._id),
            restaurantName: r.nomeRistorante,
            itemId: String(item._id),
            prezzo: (typeof item.prezzo !== 'undefined') ? item.prezzo : m.prezzo
          }]
        };
        
        result.push(entry);
      }
    }

    res.json(result);
  } catch (e) {
    console.error('GET /available-meals', e);
    res.status(500).json({ msg: 'Errore server' });
  }
});

/**
 * @swagger
 * /api/available-tags:
 *   get:
 *     summary: Ottieni tutti i tag disponibili
 *     tags: [Menu Pubblico]
 *     security: []
 *     responses:
 *       200:
 *         description: Lista di tutti i tag disponibili
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *               description: Array di tag ordinati alfabeticamente
 *       500:
 *         description: Errore server
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
//TUTTI I TAG DISPONIBILI
router.get('/available-tags', async (req, res) => {
  try {
    const allTags = new Set();
    const Meal = require('../models/Meal');
    const allMeals = await Meal.find({}).lean();

    for (const meal of allMeals) {
      if (Array.isArray(meal.strTags)) {
        meal.strTags.forEach(tag => {
          if (tag && tag.trim()) {
            if (tag.includes(',')) {
              tag.split(',').forEach(subTag => {
                if (subTag && subTag.trim()) {
                  allTags.add(subTag.trim());
                }
              });
            } else {
              allTags.add(tag.trim());
            }
          }
        });
      } else if (typeof meal.strTags === 'string' && meal.strTags) {
        meal.strTags.split(',').forEach(tag => {
          if (tag && tag.trim()) {
            allTags.add(tag.trim());
          }
        });
      }
      if (Array.isArray(meal.tags)) {
        meal.tags.forEach(tag => {
          if (tag && tag.trim()) {
            if (tag.includes(',')) {
              tag.split(',').forEach(subTag => {
                if (subTag && subTag.trim()) {
                  allTags.add(subTag.trim());
                }
              });
            } else {
              allTags.add(tag.trim());
            }
          }
        });
      }
    }
    const rests = await Restaurant.find({}).populate('menu.meal').lean();

    for (const r of (rests || [])) {
      for (const item of (r.menu || [])) {
        const m = item?.meal;
        if (!m || !m._id) continue;

        if (Array.isArray(item.strTags)) {
          item.strTags.forEach(tag => {
            if (tag && tag.trim()) {
              if (tag.includes(',')) {
                tag.split(',').forEach(subTag => {
                  if (subTag && subTag.trim()) {
                    allTags.add(subTag.trim());
                  }
                });
              } else {
                allTags.add(tag.trim());
              }
            }
          });
        }
      }
    }

    const result = Array.from(allTags).sort();
    res.json(result);
  } catch (e) {
    console.error('GET /available-tags', e);
    res.status(500).json({ msg: 'Errore server' });
  }
});

module.exports = router;
