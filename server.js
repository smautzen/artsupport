require('dotenv').config();
const express = require('express');
const admin = require('firebase-admin');
const app = express();
const port = process.env.PORT || 4000;
const cors = require('cors');

// Initialize Firebase Admin
const serviceAccount = require('./firebase-service-account.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL // Replace this in your .env file
});

// Middleware
app.use(express.json());
app.use(cors());

// Test Route
app.get('/', (req, res) => {
  res.send('Backend is running!');
});

// Start Server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

app.post('/create', async (req, res) => {
  const data = req.body;
  const db = admin.firestore();
  try {
    const docRef = await db.collection('testCollection').add(data);
    res.status(201).send({ id: docRef.id });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});
