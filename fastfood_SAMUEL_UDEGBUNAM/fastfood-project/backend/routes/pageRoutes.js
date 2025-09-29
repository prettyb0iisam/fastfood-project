const express = require('express');
const path = require('path');
const router = express.Router();

//MAPPATURA DELLE PAGINE
const pages = {
  'login': 'login/login.html',
  'register': 'register/register.html',
  'noregister-menu': 'noregister-menu/noregister-menu.html',
  'menu': 'menu/menu.html',
  'cart': 'cart/cart.html',
  'orders': 'orders/orders.html',
  'profile': 'profile/profilo.html',
  'mymenu': 'mymenu/mymenu.html',
  'newmeal': 'newmeal/newmeal.html',
  'restaurants': 'restaurants/restaurants.html',
  'public-menu': 'public-menu/public-menu.html',
  'restaurant-orders': 'restaurant-orders/restaurant-orders.html',
  'restaurant-history': 'restaurant-history/restaurant-history.html',
  'storico': 'storico/storico.html',
  'all-meals': 'all-meals/all-meals.html'
};

//ROTTE DINAMICHE PER TUTTE LE PAGINE
Object.keys(pages).forEach(pageName => {
  router.get(`/${pageName}`, (req, res) => {
    const filePath = path.join(__dirname, '..', '..', 'frontend', 'pagine', pages[pageName]);
    res.sendFile(filePath);
  });
});

module.exports = router;
