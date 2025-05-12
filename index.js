const express = require('express');
const admin = require('firebase-admin');
const app = express();
const PORT = process.env.PORT ?? 3000;
require('dotenv').config();

// Firebase Admin Init
const serviceAccount = require('./config/serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.URL
});

const db = admin.database();
app.use(express.json());

console.log(admin.appCheck());


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
