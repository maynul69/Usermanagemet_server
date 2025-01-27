const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const pool = require('./db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;



app.use(express.json());

const corsOptions = {
  origin: 'http://localhost:5173', // Frontend origin
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allowed HTTP methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Allowed headers
};


app.use(cors());

app.options('*', cors(corsOptions)); 

const authenticate = async (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, 'secret_key');
    const user = await pool.query('SELECT * FROM users WHERE id = $1 AND status = $2', [decoded.id, 'active']);
    if (user.rowCount === 0) return res.status(403).json({ error: 'Blocked or non-existent user' });
    req.user = user.rows[0];
    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

app.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const result = await pool.query('INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *', [name, email, hashedPassword]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(400).json({ error: 'Email already exists' });
  }
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  if (result.rowCount === 0) return res.status(404).json({ error: 'User not found' });

  const user = result.rows[0];
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch || user.status === 'blocked') return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ id: user.id }, 'secret_key');
  await pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);
  res.json({ token, user });
});

app.get('/users', authenticate, async (req, res) => {
  const result = await pool.query('SELECT id, name, email, status, last_login FROM users ORDER BY last_login DESC');
  res.json(result.rows);
});

app.put('/users/block', authenticate, async (req, res) => {
  const { ids } = req.body;
  await pool.query('UPDATE users SET status = $1 WHERE id = ANY($2)', ['blocked', ids]);
  res.sendStatus(200);
});

app.put('/users/unblock', authenticate, async (req, res) => {
  const { ids } = req.body;
  await pool.query('UPDATE users SET status = $1 WHERE id = ANY($2)', ['active', ids]);
  res.sendStatus(200);
});

app.delete('/users', authenticate, async (req, res) => {
  const { ids } = req.body;
  await pool.query('DELETE FROM users WHERE id = ANY($1)', [ids]);
  res.sendStatus(200);
});


app.listen(PORT, () => console.log('Server running on port 5000'));