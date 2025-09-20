// server/src/index.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const { pool } = require('./db');
const holdsRoutes = require('../routes/holds');
const ordersRoutes = require('../routes/orders');
const paymentsRoutes = require('../routes/payments');
const ticketsRoutes = require('../routes/tickets');
const refundsRoutes = require('../routes/refunds');
const reportsRoutes = require('../routes/reports');
const usersRoutes = require('../routes/users');
const moviesRoutes = require('../routes/movies');
const showtimesRoutes = require('../routes/showtimes');
const tmdbRoutes = require('../routes/tmdb'); 
const exhibitorsRoutes = require('../routes/exhibitors');
const branchesRoutes = require('../routes/branches');
const catalogRoutes = require('../routes/catalog');
const roomsRoutes = require('../routes/rooms');
const seatsRoutes = require('../routes/seats');
const vouchersRoutes = require('../routes/vouchers');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', async (_req, res) => {
  try {
    const [r] = await pool.query('SELECT 1 AS ok');
    res.json({ ok: r[0].ok === 1 });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.use('/api', holdsRoutes);
app.use('/api', ordersRoutes);
app.use('/api', paymentsRoutes);
app.use('/api', ticketsRoutes);
app.use('/api', refundsRoutes);
app.use('/api', reportsRoutes);
app.use('/api', usersRoutes);
app.use('/api', moviesRoutes);
app.use('/api', showtimesRoutes);
app.use('/api', exhibitorsRoutes);
app.use('/api', branchesRoutes);
app.use('/api', tmdbRoutes); 
app.use('/api', catalogRoutes);
app.use('/api', roomsRoutes);
app.use('/api', seatsRoutes);
app.use('/api', vouchersRoutes);

setInterval(async () => {
  try { await pool.query('DELETE FROM seat_holds WHERE expire_at <= UTC_TIMESTAMP()'); } catch {}
}, 30000);

const port = Number(process.env.PORT || 4000);
app.listen(port, () => console.log(`BE running :${port}`));
