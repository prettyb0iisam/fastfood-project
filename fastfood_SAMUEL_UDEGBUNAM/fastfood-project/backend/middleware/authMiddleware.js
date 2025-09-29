const User = require('../models/User');

async function requireLogin(req, res, next) {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ msg: 'Non autenticato' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ msg: 'Utente non trovato' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('Errore in requireLogin:', err);
    res.status(500).json({ msg: 'Errore server durante autenticazione' });
  }
}

function requireRistoratore(req, res, next) {
  if (req.user?.tipo !== 'ristoratore') {
    return res.status(403).json({ msg: 'Solo ristoratori possono accedere a questa risorsa' });
  }
  next();
}

module.exports = { requireLogin, requireRistoratore };
