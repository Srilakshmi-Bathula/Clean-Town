const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const dustbins = [
  { name: "Public Dustbin 1", location: "Hospital Road", type: "Standard", lat_offset: 0.005, lng_offset: 0.005 },
  { name: "Recycle Center", location: "Market Area", type: "Recycle", lat_offset: -0.008, lng_offset: 0.012 },
  { name: "Hazardous Waste Bin", location: "Industrial Zone", type: "Hazardous", lat_offset: 0.015, lng_offset: -0.01 },
  { name: "Green Bin", location: "Main Park", type: "Organic", lat_offset: -0.002, lng_offset: -0.005 },
  { name: "Plastic Only Bin", location: "Bus Stand", type: "Plastic", lat_offset: 0.008, lng_offset: -0.015 }
];

async function seed() {
  console.log("Seeding dustbins...");
  for (const bin of dustbins) {
    await db.collection('dustbins').add({
      ...bin,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }
  console.log("Done!");
  process.exit();
}

seed();
