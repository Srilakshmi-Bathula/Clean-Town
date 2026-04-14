const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const randomSwaps = [
  {
    itemName: 'Ergonomic Office Chair',
    description: 'Slightly worn but very comfortable. Good for students.',
    location: 'Bhimavaram Housing Board',
    status: 'Available',
    ownerId: 'system-gen',
    createdAt: new Date().toISOString()
  },
  {
    itemName: 'Physics Textbook (Class 12)',
    description: 'Good condition, useful for entrance exams.',
    location: 'SRKR Engineering College Road',
    status: 'Available',
    ownerId: 'system-gen',
    createdAt: new Date().toISOString()
  },
  {
    itemName: 'Set of Clay Pots',
    description: '3 medium-sized pots for indoor plants.',
    location: 'Main Road Market',
    status: 'Available',
    ownerId: 'system-gen',
    createdAt: new Date().toISOString()
  },
  {
    itemName: 'Rechargeable LED Lantern',
    description: 'Works perfectly, helpful during power cuts.',
    location: 'JP Road Area',
    status: 'Claimed',
    ownerId: 'system-gen',
    createdAt: new Date().toISOString()
  },
  {
    itemName: 'Stainless Steel Water Bottles (2pcs)',
    description: '1 liter each, never used.',
    location: 'Near Railway Station',
    status: 'Available',
    ownerId: 'system-gen',
    createdAt: new Date().toISOString()
  }
];

async function seedSwaps() {
  console.log("Seeding Eco-Swaps...");
  try {
    const batch = db.batch();
    randomSwaps.forEach(item => {
      const docRef = db.collection('swaps').doc();
      batch.set(docRef, item);
    });
    await batch.commit();
    console.log("Success! Swaps added to database.");
  } catch (err) {
    console.error("Seeding failed:", err);
  }
  process.exit();
}

seedSwaps();
