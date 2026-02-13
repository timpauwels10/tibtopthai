import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import orderRoutes from './routes/orders.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Load menu data
const menuData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'menu.json'), 'utf-8'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// EJS setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Make menu data available to all views
app.use((req, res, next) => {
  res.locals.menuData = menuData;
  res.locals.currentPath = req.path;
  next();
});

// Pages
app.get('/', (req, res) => {
  res.render('index', {
    title: 'Tib Top Thai — Authentiek Thais Restaurant in Sint-Niklaas',
    description: 'Ontdek de authentieke smaken van Thailand bij Tib Top Thai in Sint-Niklaas. Verse ingrediënten, huisgemaakte curries en een warm welkom. Reserveer of bestel online.',
    canonical: 'https://tibtopthai.be/'
  });
});

app.get('/menu', (req, res) => {
  res.render('menu', {
    title: 'Menu — Tib Top Thai | Thais Restaurant Sint-Niklaas',
    description: 'Bekijk ons menu met authentieke Thaise gerechten: soepen, curries, wok, pad thai en meer.',
    canonical: 'https://tibtopthai.be/menu'
  });
});

app.get('/bestel', (req, res) => {
  res.render('bestel', {
    title: 'Online Bestellen — Tib Top Thai | Afhalen & Levering Sint-Niklaas',
    description: 'Bestel uw favoriete Thaise gerechten online bij Tib Top Thai. Afhalen of levering in Sint-Niklaas. Betaal veilig met Bancontact of kaart.',
    canonical: 'https://tibtopthai.be/bestel'
  });
});

app.get('/bestel/bevestiging', (req, res) => {
  res.render('order-confirmation', {
    title: 'Bestelling Bevestigd — Tib Top Thai',
    description: 'Uw bestelling bij Tib Top Thai is bevestigd.',
    canonical: 'https://tibtopthai.be/bestel/bevestiging',
    orderId: req.query.order || null
  });
});

app.get('/reserveer', (req, res) => {
  res.render('reserveer', {
    title: 'Reserveer — Tib Top Thai | Tafel Reserveren Sint-Niklaas',
    description: 'Reserveer uw tafel bij Tib Top Thai in Sint-Niklaas. Geniet van een authentieke Thaise eetervaring in een warme sfeer.',
    canonical: 'https://tibtopthai.be/reserveer'
  });
});

app.get('/contact', (req, res) => {
  res.render('contact', {
    title: 'Contact — Tib Top Thai | Thais Restaurant Sint-Niklaas',
    description: 'Contacteer Tib Top Thai in Sint-Niklaas. Hendrik Heymanplein 150. Bel ons, stuur een WhatsApp of kom langs.',
    canonical: 'https://tibtopthai.be/contact'
  });
});

app.get('/ons-verhaal', (req, res) => {
  res.render('ons-verhaal', {
    title: 'Ons Verhaal — Tib Top Thai | Van Thailand naar Sint-Niklaas',
    description: 'Ontdek het verhaal van Nipat en Tib Top Thai. Van Noord-Thailand naar Sint-Niklaas — een passie voor authentieke Thaise keuken.',
    canonical: 'https://tibtopthai.be/ons-verhaal'
  });
});

app.get('/catering', (req, res) => {
  res.render('catering', {
    title: 'Catering & Events — Tib Top Thai | Thaise Catering Sint-Niklaas',
    description: 'Thaise catering voor uw feest, bedrijfsevent of privé-diner. Tib Top Thai verzorgt authentieke Thaise gerechten op locatie.',
    canonical: 'https://tibtopthai.be/catering'
  });
});

// API routes
app.use('/api/orders', orderRoutes);

// Sitemap & robots
app.get('/sitemap.xml', (req, res) => {
  res.sendFile(path.join(__dirname, 'sitemap.xml'));
});

app.get('/robots.txt', (req, res) => {
  res.sendFile(path.join(__dirname, 'robots.txt'));
});

// 404
app.use((req, res) => {
  res.status(404).render('404', {
    title: 'Pagina niet gevonden — Tib Top Thai',
    description: 'Deze pagina bestaat niet.',
    canonical: 'https://tibtopthai.be/404'
  });
});

app.listen(PORT, () => {
  console.log(`Tib Top Thai server running on http://localhost:${PORT}`);
});
