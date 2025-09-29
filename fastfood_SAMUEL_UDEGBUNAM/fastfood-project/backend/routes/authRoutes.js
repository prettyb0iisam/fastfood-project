const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');


/**
 * @swagger
 * /api/register:
 *   post:
 *     summary: Registrazione nuovo utente
 *     tags: [Autenticazione]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nome
 *               - email
 *               - password
 *               - tipo
 *             properties:
 *               nome:
 *                 type: string
 *                 description: Nome dell'utente
 *               cognome:
 *                 type: string
 *                 description: Cognome (obbligatorio per clienti)
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email dell'utente
 *               password:
 *                 type: string
 *                 description: Password dell'utente
 *               tipo:
 *                 type: string
 *                 enum: [cliente, ristoratore]
 *                 description: Tipo di utente
 *               metodoPagamento:
 *                 type: string
 *                 description: Metodo di pagamento (solo per clienti)
 *               preferenze:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Preferenze alimentari (solo per clienti)
 *               nomeRistorante:
 *                 type: string
 *                 description: Nome del ristorante (solo per ristoratori)
 *               numeroTelefono:
 *                 type: string
 *                 description: Numero di telefono (solo per ristoratori)
 *               partitaIVA:
 *                 type: string
 *                 description: Partita IVA (solo per ristoratori)
 *               indirizzoRistorante:
 *                 type: string
 *                 description: Indirizzo del ristorante (solo per ristoratori)
 *     responses:
 *       201:
 *         description: Registrazione effettuata con successo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Dati mancanti o email già registrata
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
//REGISTRAZIONE
router.post('/register', async (req, res) => {
  try {
    const {
      nome,
      cognome,
      email,
      password,
      tipo,
      metodoPagamento,
      preferenze,
      nomeRistorante,
      numeroTelefono,
      partitaIVA,
      indirizzoRistorante
    } = req.body;

    if (!nome || !email || !password || !tipo) {
      return res.status(400).json({ msg: 'Nome, email, password e tipo utente sono obbligatori' });
    }

    if (tipo === 'cliente') {
      if (!cognome || !metodoPagamento) {
        return res.status(400).json({ msg: 'Tutti i campi cliente sono obbligatori' });
      }
    }

    if (tipo === 'ristoratore') {
      if (!nomeRistorante || !numeroTelefono || !partitaIVA || !indirizzoRistorante) {
        return res.status(400).json({ msg: 'Tutti i campi ristoratore sono obbligatori' });
      }
    }

    const esisteUtente = await User.findOne({ email });
    if (esisteUtente) {
      return res.status(400).json({ msg: 'Email già registrata' });
    }

    const nuovoUtente = new User({
      nome,
      cognome,
      email,
      password,
      tipo,
      ...(tipo === 'cliente' && { 
        metodoPagamento,
        preferenze: preferenze || []
      }),
      ...(tipo === 'ristoratore' && { nomeRistorante, numeroTelefono, partitaIVA, indirizzoRistorante })
    });

    await nuovoUtente.save();

    if (tipo === 'ristoratore') {
      try {
        let restaurant = await Restaurant.findOne({ 
          nomeRistorante: { $regex: new RegExp(nomeRistorante, 'i') } 
        });

        if (restaurant) {
          if (!restaurant.numeroTelefono || !restaurant.partitaIVA || !restaurant.indirizzo) {
            restaurant.numeroTelefono = numeroTelefono;
            restaurant.partitaIVA = partitaIVA;
            restaurant.indirizzo = indirizzoRistorante;
            await restaurant.save();
          }
        } else {
          const nuovoRistorante = new Restaurant({
            nomeRistorante,
            numeroTelefono,
            partitaIVA,
            indirizzo: indirizzoRistorante,
            owners: [nuovoUtente._id]
          });
          await nuovoRistorante.save();
        }
      } catch (error) {
        console.error('Errore nella creazione del ristorante:', error);
      }
    }

    return res.status(201).json({ msg: 'Registrazione Effettuata' });

  } catch (err) {
    return res.status(500).json({ msg: 'Errore server' });
  }
});


/**
 * @swagger
 * /api/login:
 *   post:
 *     summary: Login utente
 *     tags: [Autenticazione]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email dell'utente
 *               password:
 *                 type: string
 *                 description: Password dell'utente
 *     responses:
 *       200:
 *         description: Login effettuato con successo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       401:
 *         description: Password errata
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Email non trovata
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
//LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const utente = await User.findOne({ email });

    if (!utente) {
      return res.status(404).json({ msg: 'Email non trovata' });
    }
    if (utente.password !== password) {
      return res.status(401).json({ msg: 'Password errata' });
    }

    req.session.userId = utente._id.toString();

    res.json({ msg: 'Login avvenuto con successo' });

  } catch (err) {
    res.status(500).json({ msg: 'Errore server' });
  }
});


/**
 * @swagger
 * /api/logout:
 *   post:
 *     summary: Logout utente
 *     tags: [Autenticazione]
 *     security: []
 *     responses:
 *       200:
 *         description: Logout effettuato con successo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       500:
 *         description: Errore durante il logout
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
//LOGOUT
router.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ msg: 'Errore durante il logout' });
    res.clearCookie('connect.sid');
    res.json({ msg: 'Logout avvenuto con successo' });
  });
});


//PROTEZIONE ROTTE
function verificaSessione(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ msg: 'Non autenticato' });
  }
  next();
}

/**
 * @swagger
 * /api/profilo:
 *   get:
 *     summary: Ottieni profilo utente
 *     tags: [Autenticazione]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Profilo utente recuperato con successo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Non autenticato
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
//PROFILO
router.get('/profilo', verificaSessione, async (req, res) => {
  const utente = await User.findById(req.session.userId).select('-password');
  res.json(utente);
});

/**
 * @swagger
 * /api/profilo:
 *   put:
 *     summary: Aggiorna profilo utente
 *     tags: [Autenticazione]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *                 description: Nome dell'utente
 *               cognome:
 *                 type: string
 *                 description: Cognome dell'utente
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email dell'utente
 *               metodoPagamento:
 *                 type: string
 *                 description: Metodo di pagamento (solo per clienti)
 *               preferenze:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Preferenze alimentari (solo per clienti)
 *               nomeRistorante:
 *                 type: string
 *                 description: Nome del ristorante (solo per ristoratori)
 *               numeroTelefono:
 *                 type: string
 *                 description: Numero di telefono (solo per ristoratori)
 *               partitaIVA:
 *                 type: string
 *                 description: Partita IVA (solo per ristoratori)
 *               indirizzoRistorante:
 *                 type: string
 *                 description: Indirizzo del ristorante (solo per ristoratori)
 *     responses:
 *       200:
 *         description: Profilo aggiornato con successo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                 utente:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Non autenticato
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Utente non trovato
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
//UPDATE PROFILO
router.put('/profilo', verificaSessione, async (req, res) => {
  try {
    const userId = req.session.userId;

    const disallowed = ['_id', '__v', 'tipo'];
    disallowed.forEach(k => delete req.body[k]);

    const utenteAttuale = await User.findById(userId);
    if (!utenteAttuale) return res.status(404).json({ msg: 'Utente non trovato' });

    const aggiornato = await User.findByIdAndUpdate(
      userId,
      req.body,
      { new: true, runValidators: true }
    ).select('-password');

    if (!aggiornato) return res.status(404).json({ msg: 'Utente non trovato' });

    if (utenteAttuale.tipo === 'ristoratore' && 
        req.body.nomeRistorante && 
        req.body.nomeRistorante !== utenteAttuale.nomeRistorante) {
      
      try {
        const restaurant = await Restaurant.findOne({ 
          nomeRistorante: { $regex: new RegExp(utenteAttuale.nomeRistorante, 'i') } 
        });

        if (restaurant && restaurant.owners && restaurant.owners.includes(userId)) {
          await Restaurant.findByIdAndUpdate(restaurant._id, {
            nomeRistorante: req.body.nomeRistorante
          });

          const result = await User.updateMany(
            { nomeRistorante: utenteAttuale.nomeRistorante },
            { nomeRistorante: req.body.nomeRistorante }
          );

        }
      } catch (error) {
        console.error('Errore nell\'aggiornamento del nome ristorante:', error);
      }
    }

    res.json({ msg: 'Profilo aggiornato', utente: aggiornato });
  } catch (err) {
    res.status(500).json({ msg: 'Errore server' });
  }
});


/**
 * @swagger
 * /api/profilo:
 *   delete:
 *     summary: Elimina profilo utente
 *     tags: [Autenticazione]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Profilo eliminato con successo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       500:
 *         description: Errore nell'eliminazione del profilo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
//DELETE PROFILO
router.delete('/profilo', verificaSessione, async (req, res) => {
  try {
    const userId = req.session.userId;
    await User.findByIdAndDelete(userId);

    req.session.destroy(() => {});
    res.clearCookie('connect.sid');

    res.json({ msg: 'Profilo eliminato' });
  } catch (err) {
    console.error('Errore nell\'eliminazione del profilo:', err);
    res.status(500).json({ msg: 'Errore server' });
  }
});


/**
 * @swagger
 * /api/find-restaurant/{nomeRistorante}:
 *   get:
 *     summary: Cerca ristorante esistente
 *     tags: [Autenticazione]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: nomeRistorante
 *         required: true
 *         schema:
 *           type: string
 *         description: Nome del ristorante da cercare
 *     responses:
 *       200:
 *         description: Informazioni del ristorante
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 numeroTelefono:
 *                   type: string
 *                 partitaIVA:
 *                   type: string
 *                 indirizzo:
 *                   type: string
 *                 readonly:
 *                   type: boolean
 *                   description: Se i campi sono in sola lettura
 *                 isCreator:
 *                   type: boolean
 *                   description: Se l'utente è il creatore del ristorante
 *       400:
 *         description: Nome ristorante richiesto
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
//CERCA RISTORANTE ESISTENTE
router.get('/find-restaurant/:nomeRistorante', async (req, res) => {
  try {
    const { nomeRistorante } = req.params;
    
    if (!nomeRistorante) {
      return res.status(400).json({ msg: 'Nome ristorante richiesto' });
    }

    const restaurant = await Restaurant.findOne({ 
      nomeRistorante: { $regex: new RegExp(nomeRistorante, 'i') } 
    });

    if (!restaurant) {
      return res.status(404).json({ msg: 'Ristorante non trovato' });
    }

    let isCreator = false;
    if (req.session.user && req.session.user.id) {
      isCreator = restaurant.owners && restaurant.owners.includes(req.session.user.id);
    }

    const responseData = {
      numeroTelefono: restaurant.numeroTelefono || '',
      partitaIVA: restaurant.partitaIVA || '',
      indirizzo: restaurant.indirizzo || '',
      readonly: !!(restaurant.numeroTelefono && restaurant.partitaIVA && restaurant.indirizzo) && !isCreator,
      isCreator: isCreator
    };

    res.json(responseData);

  } catch (err) {
    res.status(500).json({ msg: 'Errore server' });
  }
});

/**
 * @swagger
 * /api/check-restaurant-creator/{nomeRistorante}:
 *   get:
 *     summary: Verifica se l'utente è il creatore del ristorante
 *     tags: [Autenticazione]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: nomeRistorante
 *         required: true
 *         schema:
 *           type: string
 *         description: Nome del ristorante da verificare
 *     responses:
 *       200:
 *         description: Informazioni sulla proprietà del ristorante
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isCreator:
 *                   type: boolean
 *                   description: Se l'utente è il creatore del ristorante
 *                 restaurantId:
 *                   type: string
 *                   description: ID del ristorante
 *       400:
 *         description: Nome ristorante richiesto
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Non autenticato
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
//VERIFICA SE L'UTENTE È IL CREATORE DEL RISTORANTE
router.get('/check-restaurant-creator/:nomeRistorante', verificaSessione, async (req, res) => {
  try {
    const { nomeRistorante } = req.params;
    const userId = req.session.userId;
    
    if (!nomeRistorante) {
      return res.status(400).json({ msg: 'Nome ristorante richiesto' });
    }

    const restaurant = await Restaurant.findOne({ 
      nomeRistorante: { $regex: new RegExp(nomeRistorante, 'i') } 
    });

    if (!restaurant) {
      return res.status(404).json({ msg: 'Ristorante non trovato' });
    }

    const isCreator = restaurant.owners && restaurant.owners.includes(userId);

    res.json({ 
      isCreator: isCreator,
      restaurantId: restaurant._id
    });

  } catch (err) {
    res.status(500).json({ msg: 'Errore server' });
  }
});

module.exports = router;
