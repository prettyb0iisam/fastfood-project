require('dotenv').config();

const express = require('express');
const cors = require('cors');
const session = require('express-session');
const path = require('path');
const MongoStore = require('connect-mongo');
const publicMenuRoutes = require('./routes/publicMenuRoutes');
const restaurantMenuRoutes = require('./routes/restaurantMenuRoutes');
const pageRoutes = require('./routes/pageRoutes');

const app = express();
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://fastfood-project.onrender.com';
const NODE_ENV = process.env.NODE_ENV || 'production';
const isProd = NODE_ENV === 'production';

app.set('trust proxy', 1);

app.use(express.static(path.join(__dirname, '..', 'frontend')));
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'fastfood-super-segreto',
  resave: false,
  saveUninitialized: false,
  name: 'fastfood-session',
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/fastfood',
    ttl: 60 * 60 * 24,
    stringify: false
  }),
  cookie: {
    secure: isProd,
    httpOnly: true,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000
  }
}));

require('./config/db');

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});

//ROTTA PAGINE HTML
app.use('/', pageRoutes);

//ROTTE API
app.use('/api', publicMenuRoutes); 
app.use('/api', require('./routes/authRoutes'));
app.use('/api/meals', require('./routes/mealRoutes'));
app.use('/api/my-menu', restaurantMenuRoutes);
app.use('/api/cart', require('./routes/cartRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/restaurants', require('./routes/restaurantStatsRoutes'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'pagine', 'index', 'index.html'));
});

const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

//ROTTA API-DOCS
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

//CONFIGURAZIONE SWAGGER UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  swaggerOptions: {
    url: '/api-docs.json'
  }
}));

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

app.use((req, res, next) => {
  res.status(404).json({ error: 'Pagina non trovata' });
});

app.use((err, req, res, next) => {
  console.error('Errore server:', err);
  res.status(500).json({ error: 'Errore interno del server' });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`url: https://fastfood-project.onrender.com porta:${PORT}`);
});

server.on('error', (err) => {
  console.error('Errore server:', err);
  process.exit(1);
});
