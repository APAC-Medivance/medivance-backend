const express = require('express');
const admin = require('firebase-admin');
const app = express();
const bodyParser = require('body-parser');
const PORT = process.env.PORT ?? 3000;
require('dotenv').config({ path: "./config/.env" });

// Getting Function
// const { verifyFirebaseToken } = require('./src/func');

// Firebase Admin Init
const serviceAccount = require('./config/serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.DB_URL
});

const db = admin.database();
app.use(bodyParser.json());

// Middleware untuk verifikasi token
const verifyFirebaseToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token tidak ditemukan' });
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken; // bisa dipakai di route selanjutnya
    next();
  } catch (error) {
    console.error('Error verifikasi token:', error);
    return res.status(401).json({ message: 'Token tidak valid' });
  }
};

// 🔐 Register endpoint
app.post('/register', async (req, res) => {
  const { email, password, name } = req.body;

  try {
    const user = await admin.auth().createUser({
      email,
      password,
      displayName: name,
    });
    res.json({ message: 'User berhasil dibuat', uid: user.uid });
  } catch (err) {
    res.status(400).json({ message: 'Gagal register', error: err.message });
  }
});

// 🔐 Login endpoint (manual: email+password nggak bisa diverifikasi langsung oleh Admin SDK, jadi solusi pakai Firebase Auth REST API)
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.FIREBASE_WEB_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          returnSecureToken: true,
        }),
      }
    );
    const data = await response.json();
    if (data.error) throw new Error(data.error.message);

    console.log(data);

    res.json({
      message: 'Login berhasil',
      idToken: data.idToken,
      refreshToken: data.refreshToken,
    });
  } catch (err) {
    res.status(400).json({ message: 'Login gagal', error: err.message });
  }
});

app.post('/check-user', async (req, res) => {
  const { idToken } = req.body;

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;
    res.json({ status: 'ok', uid });
  } catch (error) {
    res.status(401).json({ status: 'unauthorized', error: error.message });
  }
});

// Route yang butuh auth
app.get('/dashboard', verifyFirebaseToken, (req, res) => {
  res.send(`Selamat datang, ${req.user.name || req.user.email}`);
});

// GET family history
app.get('/family_history', async (req, res) => {
  try {
    const ref = db.ref('family_history');
    const snapshot = await ref.once('value');
    res.json(snapshot.val() || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST family history
// app.post('/family_history', async (req, res) => {
//   const { uid, father } = req.body;

//   if (!uid || !father) return res.status(400).json({ error: 'Missing uid or data' });

//   try {
//     const ref = db.ref(`family_history/${uid}`);
//     const newRef = ref.push();
//     await newRef.set({ father });

//     res.json({ status: 'ok', id: newRef.key });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });
app.post('/family_history/:uid', async (req, res) => {
  const { uid } = req.params;
  const { father } = req.body;

  if (!father) return res.status(400).json({ error: 'Missing father data' });

  try {
    const ref = db.ref(`family_history/${uid}`);
    await ref.set({ father });

    res.json({ status: 'ok', id: ref.key });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// GET semua catatan
app.get('/catatan', async (req, res) => {
  const ref = db.ref('catatan');
  ref.once('value', (snapshot) => {
    res.json(snapshot.val() || {});
  });
});

// POST catatan baru
app.post('/catatan', async (req, res) => {
  const { judul, isi } = req.body;
  const ref = db.ref('catatan');
  const newCatatanRef = ref.push();
  await newCatatanRef.set({ judul, isi });
  res.json({ status: 'ok', id: newCatatanRef.key });
});

// DELETE catatan
app.delete('/catatan/:id', async (req, res) => {
  const { id } = req.params;
  const ref = db.ref('catatan/' + id);
  await ref.remove();
  res.json({ status: 'deleted', id });
});

app.listen(PORT, () => {
  console.log(`API running in http://localhost:${PORT}`);
});
