//using mongoDb
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require("mongoose");
require('dotenv').config();
const User = require("./models/user")

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "127.0.0.1:3000",
      "https://usermanagemet-client.vercel.app"
      // "https://crm-frontend-test-rouge.vercel.app",
    ],

    credentials: true,
  })
);

const PORT = process.env.PORT || 5000;
const MONGO_URI = 'mongodb+srv://maynulhossain69:1234@crud.dstdd.mongodb.net/test?retryWrites=true&w=majority';

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log("Database connection successfully!");
}).catch((error) => {
  console.error("Database connection failed:", error);
});

app.use(express.json());


// Authentication middleware
const authenticate = async (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
    const user = await User.findOne({ _id: decoded.id, status: 'active' });
    if (!user) return res.status(403).json({ error: 'Blocked or non-existent user' });
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized' });
  }
};
// Register user
app.post('/register', async (req, res) => {
  const { name, email, password, last_login } = req.body;
  const isExit = await User.findOne({email});
  if(isExit){
    return res.status(500).json({
      meesage: "Email is already exits"
    })
    
  }
  const hashedPassword = await bcrypt.hash(password, 10);


  try {
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      status: 'active',
      last_login,
    });
    console.log(user);
    res.status(201).json({
      message: "User registered successfully!",
      user,
    });
  } catch (error) {
    console.error(error); // Log the error for debugging
    res.status(500).json({ error: 'Internal Server Error' });
  }
  
});

// Login user
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid || user.status === 'blocked') return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret_key');
    user.last_login = new Date();
    await user.save();

    res.json({ token, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get all users
app.get('/users', authenticate, async (req, res) => {
  try {
    const users = await User.find({}, { password: 0 }).sort({ last_login: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Block users
app.put('/users/block', authenticate, async (req, res) => {
  const { ids } = req.body;

  try {
    await User.updateMany({ _id: { $in: ids } }, { status: 'blocked' });
    res.sendStatus(200);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Unblock users
app.put('/users/unblock', authenticate, async (req, res) => {
  const { ids } = req.body;

  try {
    await User.updateMany({ _id: { $in: ids } }, { status: 'active' });
    res.sendStatus(200);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Delete users
app.delete('/users', authenticate, async (req, res) => {
  const { ids } = req.body;

  try {
    await User.deleteMany({ _id: { $in: ids } });
    res.sendStatus(200);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// Root endpoint
app.get('/', (req, res) => {
  res.send('Hello');
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

















//using postgres
// const express = require('express');
// const bodyParser = require('body-parser');
// const cors = require('cors');
// const pool = require('./db');
// const bcrypt = require('bcrypt');
// const jwt = require('jsonwebtoken');
// require('dotenv').config();

// const app = express();
// const PORT = process.env.PORT || 5000;



// app.use(express.json());

// const corsOptions = {
//   origin: process.env.FRONTEND_URL || 'http://localhost:5173',
//   methods: ['GET', 'POST', 'PUT', 'DELETE'],
//   allowedHeaders: ['Content-Type', 'Authorization'],
// };


// app.use(cors());

// app.options('*', cors(corsOptions)); 

// const authenticate = async (req, res, next) => {
//   const token = req.headers.authorization;
//   if (!token) return res.status(401).json({ error: 'Unauthorized' });

//   try {
//     const decoded = jwt.verify(token, 'secret_key');
//     const user = await pool.query('SELECT * FROM users WHERE id = $1 AND status = $2', [decoded.id, 'active']);
//     if (user.rowCount === 0) return res.status(403).json({ error: 'Blocked or non-existent user' });
//     req.user = user.rows[0];
//     next();
//   } catch {
//     res.status(401).json({ error: 'Unauthorized' });
//   }
// };

// app.post('/register', async (req, res) => {
//   const { name, email, password } = req.body;
//   const hashedPassword = await bcrypt.hash(password, 10);
//   try {
//     const result = await pool.query(
//       'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *',
//       [name, email, hashedPassword]
//     );
//     res.status(201).json(result.rows[0]);
//   } catch (error) {
//     if (error.code === '23505') { // PostgreSQL unique_violation error code
//       res.status(400).json({ error: 'Email already exists' });
//     } else {
//       res.status(500).json({ error: 'Internal Server Error' });
//     }
//   }
// });


// app.post('/login', async (req, res) => {
//   const { email, password } = req.body;
//   const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
//   if (result.rowCount === 0) return res.status(404).json({ error: 'User not found' });

//   const user = result.rows[0];
//   const isMatch = await bcrypt.compare(password, user.password);
//   if (!isMatch || user.status === 'blocked') return res.status(401).json({ error: 'Invalid credentials' });

//   const token = jwt.sign({ id: user.id }, 'secret_key');
//   await pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);
//   res.json({ token, user });
// });

// app.get('/users', async (req, res) => {
//   const result = await pool.query('SELECT id, name, email,password, status, last_login FROM users ORDER BY last_login DESC');
//   res.json(result.rows);
// });

// app.put('/users/block', authenticate, async (req, res) => {
//   const { ids } = req.body;
//   await pool.query('UPDATE users SET status = $1 WHERE id = ANY($2)', ['blocked', ids]);
//   res.sendStatus(200);
// });

// app.put('/users/unblock', authenticate, async (req, res) => {
//   const { ids } = req.body;
//   await pool.query('UPDATE users SET status = $1 WHERE id = ANY($2)', ['active', ids]);
//   res.sendStatus(200);
// });

// app.delete('/users', authenticate, async (req, res) => {
//   const { ids } = req.body;
//   await pool.query('DELETE FROM users WHERE id = ANY($1)', [ids]);
//   res.sendStatus(200);
// });

// app.get('/', async (req, res) => {
//   res.send("Hello")
// });



// app.listen(PORT, () => console.log('Server running on port 5000'));