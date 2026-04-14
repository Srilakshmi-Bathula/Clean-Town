const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function listUsers() {
  console.log("Fetching users...");
  try {
    const snapshot = await db.collection('users').get();
    if (snapshot.empty) {
      console.log("No users found in Firestore 'users' collection.");
    } else {
      snapshot.forEach(doc => {
        console.log(doc.id, '=>', doc.data());
      });
    }
  } catch (err) {
    console.error("Error accessing Firestore:", err);
  }
  process.exit();
}

listUsers();
