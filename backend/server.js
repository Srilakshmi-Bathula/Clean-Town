const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const xss = require('xss-clean');
const hpp = require('hpp');
const { body, validationResult } = require('express-validator');
require('dotenv').config();

const app = express();

// --- Security & Global Middlewares ---
// app.use(helmet()); 
// app.use(xss()); 
app.use(hpp()); 
app.use(express.json({ limit: '10kb' })); 
app.use(cookieParser());
app.use(cors({ origin: true, credentials: true })); 
app.use(morgan('combined')); 

// General Rate Limiter
/*
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 1000, 
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);
*/

// Auth Rate Limiter
/*
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, 
  max: 10, 
  message: { error: 'Too many authentication attempts, please try again in an hour.' }
});
app.use('/api/auth/', authLimiter);
*/

// --- Email Service Setup ---
const emailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_FROM,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async (to, subject, htmlBody) => {
  if (!process.env.EMAIL_FROM || !process.env.EMAIL_PASS || process.env.EMAIL_FROM === 'your-email@gmail.com') {
    console.warn('[EMAIL] Credentials not configured in .env. Skipping email to:', to);
    return;
  }
  try {
    await emailTransporter.sendMail({
      from: `"CleanTown" <${process.env.EMAIL_FROM}>`,
      to,
      subject,
      html: htmlBody,
    });
    console.log(`[EMAIL] Sent to ${to}: ${subject}`);
  } catch (err) {
    console.error(`[EMAIL] Failed to send to ${to}:`, err.message);
    // Email failures NEVER block user actions
  }
};

const welcomeEmailHtml = (name) => `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
  <div style="background: #138808; padding: 24px; text-align: center;">
    <h1 style="color: white; margin: 0;">🌿 Welcome to CleanTown!</h1>
  </div>
  <div style="padding: 32px;">
    <p style="font-size: 1.1rem;">Hi <strong>${name}</strong>,</p>
    <p>Thank you for joining <strong>CleanTown</strong> – together, we can make our city cleaner!</p>
    <p>Here's what you can do now:</p>
    <ul>
      <li>📍 <strong>Report issues</strong> like illegal dumping or overflowing bins</li>
      <li>♻️ <strong>List reusable items</strong> on our Eco-Swap marketplace</li>
      <li>🏆 <strong>Earn points</strong> and climb the leaderboard</li>
    </ul>
    <p style="margin-top: 24px;">Let's clean up our city, one report at a time! 💪</p>
    <p>– The CleanTown Team</p>
  </div>
  <div style="background: #f3f4f6; padding: 16px; text-align: center; font-size: 0.8rem; color: #6b7280;">
    CleanTown | Keeping Our City Clean
  </div>
</div>`;

const reportEmailHtml = (name, type, location) => `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
  <div style="background: #FF9933; padding: 24px; text-align: center;">
    <h1 style="color: white; margin: 0;">✅ Report Received!</h1>
  </div>
  <div style="padding: 32px;">
    <p style="font-size: 1.1rem;">Hi <strong>${name || 'Citizen'}</strong>,</p>
    <p>We have successfully received your report. Here's a summary:</p>
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
      <tr><td style="padding: 8px; background: #f9fafb; font-weight: bold;">Issue Type</td><td style="padding: 8px;">${type}</td></tr>
      <tr><td style="padding: 8px; background: #f9fafb; font-weight: bold;">Location</td><td style="padding: 8px;">${location || 'Not provided'}</td></tr>
      <tr><td style="padding: 8px; background: #f9fafb; font-weight: bold;">Status</td><td style="padding: 8px; color: #138808;"><strong>Received</strong></td></tr>
    </table>
    <p>Our team will review your report and take appropriate action. Thank you for helping keep our city clean!</p>
    <p>You earned <strong style="color: #FF9933;">+50 Points</strong> for this report.</p>
    <p>– The CleanTown Team</p>
  </div>
  <div style="background: #f3f4f6; padding: 16px; text-align: center; font-size: 0.8rem; color: #6b7280;">
    CleanTown | Keeping Our City Clean
  </div>
</div>`;

// Initialize Firebase Admin
try {
    const serviceAccount = require('./serviceAccountKey.json');
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env.FIREBASE_DATABASE_URL
    });
    console.log("Firebase Admin initialized successfully");
} catch (err) {
    console.warn("Firebase Admin NOT initialized. Please add serviceAccountKey.json to backend/ folder.");
}

const db = admin.apps.length ? admin.firestore() : null;

// --- Security Middlewares ---

// Generic Response wrapper
const sendSuccess = (res, data, message = 'Success') => {
  res.json({ success: true, message, data });
};

const sendError = (res, status, message = 'An error occurred') => {
  // Generic error messages for security
  res.status(status).json({ success: false, error: message });
};

// Auth middleware (Session Cookie)
const verifyAuth = async (req, res, next) => {
  const sessionCookie = req.cookies.session || '';
  
  try {
    const decodedClaims = await admin.auth().verifySessionCookie(sessionCookie, true);
    req.user = decodedClaims;
    next();
  } catch (err) {
    // If session cookie fails, try Authorization header for ID Token (during migration/login)
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (idToken) {
        try {
            const decodedToken = await admin.auth().verifyIdToken(idToken);
            req.user = decodedToken;
            return next();
        } catch (authErr) {
            // Fall through to unauthorized
        }
    }
    sendError(res, 401, 'Invalid session. Please log in.');
  }
};

// Role Based Access Control
const checkRole = (roles) => (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role || 'user')) {
        console.warn(`[AUTH] Unauthorized role access attempt by user ${req.user?.uid || 'unknown'}`);
        return sendError(res, 403, 'You do not have permission to perform this action.');
    }
    next();
};

// Server-side validation middleware
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

// --- Helper: Create Notification ---
const createNotification = async (userId, title, message, type) => {
  if (!db) return;
  try {
    await db.collection('notifications').add({
      userId,
      title,
      message,
      type,
      isRead: false,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
  } catch (err) {
    console.error("Failed to create notification:", err);
  }
};

const logSecurityEvent = async (userId, eventType, details) => {
    if (!db) return;
    try {
        await db.collection('security_logs').add({
            userId: userId || 'anonymous',
            eventType,
            details,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            ip: details.ip || 'unknown',
            userAgent: details.userAgent || 'unknown'
        });
        console.log(`[SECURITY] ${eventType} logged for ${userId || 'anonymous'}`);
    } catch (err) {
        console.error("Failed to log security event:", err);
    }
};

// 1. Auth & User Management
app.post('/api/auth/login', async (req, res) => {
  const { idToken, mfaCode } = req.body;
  const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;
    
    // Check if user has MFA enabled (Simulated check)
    const userDoc = await db.collection('users').doc(uid).get();
    const userData = userDoc.data();
    
    if (userData?.mfaEnabled && !mfaCode) {
        return res.status(200).json({ success: true, mfaRequired: true, message: 'MFA required' });
    }
    
    // If MFA code is provided, verify it (Simulated verification of '123456')
    if (userData?.mfaEnabled && mfaCode !== '123456') {
        await logSecurityEvent(uid, 'FAILED_MFA', { ip: req.ip, userAgent: req.get('User-Agent') });
        return sendError(res, 401, 'Invalid MFA code');
    }

    const sessionCookie = await admin.auth().createSessionCookie(idToken, { expiresIn });
    res.cookie('session', sessionCookie, { 
      maxAge: expiresIn, 
      httpOnly: true, 
      secure: true,
      sameSite: 'strict' 
    });
    
    await logSecurityEvent(uid, 'SUCCESSFUL_LOGIN', { ip: req.ip, userAgent: req.get('User-Agent') });
    sendSuccess(res, { message: 'Login successful' });
  } catch (err) {
    await logSecurityEvent(null, 'FAILED_LOGIN', { ip: req.ip, userAgent: req.get('User-Agent'), error: err.message });
    sendError(res, 401, 'Invalid credentials');
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('session');
  sendSuccess(res, { message: 'Signed out successfully' });
});

app.post('/api/auth/signup', 
  [
    body('email').isEmail().normalizeEmail(),
    body('name').trim().notEmpty(),
    body('id').notEmpty(),
  ],
  validate,
  async (req, res) => {
    const { id, name, email } = req.body;
    if (!db) return sendError(res, 500, 'Database error');
    
    try {
      // Check if user already exists in Firestore (redundant but good for security checks)
      const userDoc = await db.collection('users').doc(id).get();
      if (userDoc.exists) {
        // Use generic response even if account exists
        return sendSuccess(res, { message: 'Verification email sent if account is new' });
      }

      await db.collection('users').doc(id).set({
        id,
        name,
        email,
        points: 0,
        role: 'user', // Default role
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      await createNotification(id, "Welcome to CleanTown!", "Thank you for joining our mission to keep the city clean.", "reward");
      
      // Send verification link (Firebase Auth)
      const link = await admin.auth().generateEmailVerificationLink(email);
      sendEmail(email, '📧 Verify your CleanTown account', `Please verify your email by clicking: ${link}`);
      
      // Send welcome email
      sendEmail(email, '🎉 Welcome to CleanTown!', welcomeEmailHtml(name));
      
      sendSuccess(res, { message: 'User registered' });
    } catch (err) {
      console.error(`[AUTH] Signup error:`, err.message);
      // Generic response for duplicate accounts to prevent enumeration
      sendSuccess(res, { message: 'Registration initiated' });
    }
});

app.post('/api/auth/reset-password', 
  body('email').isEmail().normalizeEmail(),
  validate,
  async (req, res) => {
    const { email } = req.body;
    try {
      const link = await admin.auth().generatePasswordResetLink(email);
      sendEmail(email, '🔑 Reset your CleanTown password', `Click here to reset: ${link}`);
      // Always return success to prevent email enumeration
      sendSuccess(res, { message: 'If an account exists, a reset link has been sent.' });
    } catch (err) {
      sendSuccess(res, { message: 'If an account exists, a reset link has been sent.' });
    }
});

app.get('/api/users/:id', verifyAuth, async (req, res) => {
  if (!db) return sendError(res, 500, 'Database error');
  // Authorization: Only allow user to view their own profile unless admin
  if (req.params.id !== req.user.uid && req.user.role !== 'admin') {
      return sendError(res, 403, 'Unauthorized access to profile');
  }
  try {
    const doc = await db.collection('users').doc(req.params.id).get();
    if (!doc.exists) return sendError(res, 404, 'User not found');
    res.json({ id: doc.id, ...doc.data() });
  } catch (err) {
    sendError(res, 500, 'Internal server error');
  }
});

// 2. Reports API
app.get('/api/reports', async (req, res) => {
  if (!db) return res.json([]);
  try {
    const snapshot = await db.collection('reports').orderBy('createdAt', 'desc').get();
    const reports = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/report', 
  verifyAuth,
  [
    body('type').notEmpty().escape(),
    body('location').notEmpty().escape(),
    body('description').optional().escape(),
    body('userId').custom((val, { req }) => val === req.user.uid)
  ],
  validate,
  async (req, res) => {
  const { type, imageUrl, location, lat, lng, description, userId, isHazardous } = req.body;
  if (!db) return sendError(res, 500, 'Database error');
  
  const isEmergency = type === 'smoke';
  const now = admin.firestore.Timestamp.now();
  const newReport = {
    type,
    imageUrl: imageUrl || null,
    location,
    lat: lat || null,
    lng: lng || null,
    description: description || '',
    status: 'Reported',
    statusHistory: [
      { status: 'Reported', timestamp: now, label: 'Issue submitted by citizen' }
    ],
    isEmergency,
    isHazardous: !!isHazardous,
    userId,
    upvotes: 0,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  };
  
  try {
    const docRef = await db.collection('reports').add(newReport);
    // Award points
    await db.collection('users').doc(userId).update({
      points: admin.firestore.FieldValue.increment(50)
    });

    await createNotification(userId, "Points Awarded!", "You earned 50 points for reporting a waste issue.", "reward");
    await createNotification(userId, "Report Filed", `Your report for "${type}" at ${location} has been successfully submitted.`, "report");

    if (isHazardous) {
      await createNotification(userId, "⚠️ Animal Safety Alert", "Your report contained hazardous materials. Thank you for helping protect local animals!", "emergency");
    }

    sendSuccess(res, { id: docRef.id, ...newReport });
  } catch (err) {
    sendError(res, 500, 'Failed to submit report');
  }
});

app.post('/api/verify', async (req, res) => {
  const { reportId } = req.body;
  if (!db) return res.status(500).json({ error: 'Database not initialized' });
  try {
    const reportDoc = await db.collection('reports').doc(reportId).get();
    if (reportDoc.exists) {
        const report = reportDoc.data();
        await db.collection('reports').doc(reportId).update({
          upvotes: admin.firestore.FieldValue.increment(1)
        });
        
        if (report.userId) {
            await createNotification(report.userId, "Community Support!", "Another citizen upvoted your report. Your contribution is making an impact!", "report");
        }
    }
    res.json({ message: 'Report verified' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Eco-Swap API
app.get('/api/swaps', async (req, res) => {
  if (!db) return res.json([]);
  try {
    const snapshot = await db.collection('swaps').orderBy('createdAt', 'desc').get();
    const swaps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(swaps);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/swap/create', 
  verifyAuth,
  [
    body('itemName').notEmpty().escape(),
    body('description').notEmpty().escape(),
    body('ownerId').custom((val, { req }) => val === req.user.uid),
    body('location').notEmpty().escape()
  ],
  validate,
  async (req, res) => {
  const { itemName, description, ownerId, location } = req.body;
  if (!db) return sendError(res, 500, 'Database error');
  
  const newSwap = {
    itemName,
    description,
    ownerId,
    location,
    claimedBy: null,
    status: 'Available',
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  };
  
  try {
    const docRef = await db.collection('swaps').add(newSwap);
    // Award points
    await db.collection('users').doc(ownerId).update({
      points: admin.firestore.FieldValue.increment(100)
    });

    await createNotification(ownerId, "Points Awarded!", "You earned 100 points for listing a reusable item.", "reward");
    await createNotification(ownerId, "Item Listed", `Your item "${itemName}" is now available in the marketplace.`, "swap");

    sendSuccess(res, { id: docRef.id, ...newSwap });
  } catch (err) {
    sendError(res, 500, 'Failed to create swap');
  }
});

app.post('/api/swap/claim', 
  verifyAuth,
  [
    body('swapId').notEmpty(),
    body('userId').custom((val, { req }) => val === req.user.uid)
  ],
  validate,
  async (req, res) => {
  const { swapId, userId } = req.body;
  if (!db) return sendError(res, 500, 'Database error');
  
  try {
    const swapDoc = await db.collection('swaps').doc(swapId).get();
    if (!swapDoc.exists) return sendError(res, 404, 'Item not found');
    
    const swap = swapDoc.data();
    if (swap.ownerId === userId) {
        return sendError(res, 400, 'You cannot claim your own item');
    }

    await db.collection('swaps').doc(swapId).update({
      status: 'Claimed',
      claimedBy: userId
    });

    // Notify Owner
    if (swap.ownerId) {
        await createNotification(swap.ownerId, "Item Claimed!", `Your item "${swap.itemName}" has been successfully claimed by another citizen.`, "swap");
    }
    // Notify Claimant
    await createNotification(userId, "Claim Successful", `You successfully claimed "${swap.itemName}". Contact owner for details.`, "swap");

    sendSuccess(res, { message: 'Item claimed' });
  } catch (err) {
    sendError(res, 500, 'Failed to claim item');
  }
});

// 4. Pickup API
app.post('/api/pickup', async (req, res) => {
  const { reportId, userId } = req.body;
  if (!db) return res.status(500).json({ error: 'Database not initialized' });
  try {
    await db.collection('pickups').add({
      reportId,
      userId,
      status: 'Requested',
      requestedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    res.json({ message: 'Pickup requested' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Dustbins API
app.get('/api/dustbins', async (req, res) => {
  if (!db) return res.json([]);
  try {
    const snapshot = await db.collection('dustbins').get();
    const dustbins = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(dustbins);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Leaderboard
app.get('/api/leaderboard', async (req, res) => {
  if (!db) return res.json([]);
  try {
    const snapshot = await db.collection('users').orderBy('points', 'desc').limit(10).get();
    const leaders = snapshot.docs.map(doc => ({ name: doc.data().name, points: doc.data().points }));
    res.json(leaders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/feedback', async (req, res) => {
  if (!db) return res.status(200).json({ status: 'mock_success' });
  try {
    await db.collection('feedback').add(req.body);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Emergency Reports (Anonymized)
app.post('/api/emergency', async (req, res) => {
  const { smokeLevel, location, photo, timestamp, name } = req.body;
  
  const newEmergencyReport = {
    name: name || 'Anonymous',
    smokeLevel,
    location,
    photo,
    timestamp,
    status: 'Emergency',
    createdAt: admin.apps.length ? admin.firestore.FieldValue.serverTimestamp() : new Date()
  };
  
  // Broadcast Emergency Alert to all active users (Demo simulation)
  if (db) {
    try {
        const usersSnapshot = await db.collection('users').limit(10).get();
        usersSnapshot.forEach(async (userDoc) => {
            await createNotification(userDoc.id, "EMERGENCY ALERT", `Smoke detected near ${location}. Stay alert and avoid the area.`, "emergency");
        });
    } catch (err) {
        console.error("Emergency broadcast failed:", err);
    }
  }

  if (!db) {
    console.warn("[MOCK] Database not initialized. Returning mock success.");
    return res.status(201).json({ id: 'mock-id-' + Date.now(), ...newEmergencyReport, note: 'Mocked Success' });
  }

  try {
    const docRef = await db.collection('emergency_reports').add(newEmergencyReport);
    console.log(`[DATABASE] Emergency Report Saved: ${docRef.id} from ${newEmergencyReport.name}`);
    res.status(201).json({ id: docRef.id, ...newEmergencyReport });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Notifications API
app.get('/api/notifications/:userId', async (req, res) => {
  if (!db) return res.json([]);
  try {
    const snapshot = await db.collection('notifications')
      .where('userId', '==', req.params.userId)
      .orderBy('timestamp', 'desc')
      .limit(20)
      .get();
    const notifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/notifications/mark-read', async (req, res) => {
  const { notificationId } = req.body;
  if (!db) return res.status(500).json({ error: 'Database not initialized' });
  try {
    await db.collection('notifications').doc(notificationId).update({ isRead: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 9. Weather API (Proxy for OpenWeather / Open-Meteo Fallback)
app.get('/api/weather', async (req, res) => {
  const { lat, lon } = req.query;
  const apiKey = process.env.OPENWEATHER_API_KEY;
  const axios = require('axios');

  if (!lat || !lon) {
    return res.status(400).json({ error: 'Latitude and longitude are required' });
  }

  // If API key is missing or placeholder, use Open-Meteo (Free, No Key Required)
  if (!apiKey || apiKey === 'your_openweathermap_api_key_here' || apiKey.length < 10) {
    try {
      const response = await axios.get(`https://api.open-meteo.com/v1/forecast`, {
        params: {
          latitude: lat,
          longitude: lon,
          current_weather: true,
          temperature_unit: 'celsius'
        }
      });
      
      const cur = response.data.current_weather;
      // Map Open-Meteo to OpenWeather format for frontend compatibility
      return res.json({
        main: { temp: cur.temperature, humidity: 65 }, // Open-Meteo current_weather doesn't always have humidity in simple call
        weather: [{ 
          main: cur.weathercode > 50 ? 'Rain' : 'Clear', 
          description: 'fetching live data via Open-Meteo',
          icon: new Date().getHours() >= 18 || new Date().getHours() <= 6 ? '01n' : '01d'
        }],
        name: 'India Region (Open-Meteo Live)'
      });
    } catch (err) {
      console.warn("[WEATHER] Open-Meteo fallback failed, using static mock.");
    }
  }

  // Fallback Static Mock Data (last resort)
  const hour = new Date().getHours();
  const isNight = hour >= 18 || hour <= 6;
  const mockWeather = {
    main: { temp: isNight ? 28 : 34, humidity: 70 },
    weather: [{ main: 'Clear', description: 'clear sky', icon: isNight ? '01n' : '01d' }],
    name: 'India Region (Mock)'
  };

  try {
    const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather`, {
      params: { lat, lon, appid: apiKey, units: 'metric' },
      timeout: 3000 
    });
    res.json(response.data);
  } catch (err) {
    res.json(mockWeather);
  }
});

// 10. Cleanliness Score API
app.get('/api/cleanliness-score', async (req, res) => {
  if (!db) return res.json({ score: 100, totalReports: 0, resolvedReports: 0 });
  
  const { lat, lng, radius = 0.01 } = req.query; // Smaller radius for "Area" (~1km)
  
  try {
    const snapshot = await db.collection('reports').get();
    let reports = snapshot.docs.map(doc => doc.data());

    // Filter by proximity if coordinates are provided
    if (lat && lng) {
        const uLat = parseFloat(lat);
        const uLng = parseFloat(lng);
        const rad = parseFloat(radius);
        reports = reports.filter(r => {
            if (!r.lat || !r.lng) return false;
            return Math.abs(r.lat - uLat) < rad && Math.abs(r.lng - uLng) < rad;
        });
    }

    const total = reports.length;
    const resolved = reports.filter(r => r.status === 'Resolved').length;
    
    // Score = (Resolved / Total) * 100
    let score = 100;
    if (total > 0) {
        score = Math.round((resolved / total) * 100);
    }

    res.json({
        score,
        totalReports: total,
        resolvedReports: resolved,
        area: req.query.location || 'Local Area'
    });
  } catch (err) {
    console.error("Score API error:", err);
    res.status(500).json({ error: 'Failed to calculate score' });
  }
});

// 11. User Impact API
app.get('/api/user/impact/:userId', verifyAuth, async (req, res) => {
  if (!db) return sendError(res, 500, 'Database error');
  const { userId } = req.params;

  try {
    const [userDoc, reportsSnap, swapsSnap] = await Promise.all([
      db.collection('users').doc(userId).get(),
      db.collection('reports').where('userId', '==', userId).get(),
      db.collection('swaps').where('ownerId', '==', userId).get()
    ]);

    const userData = userDoc.exists ? userDoc.data() : { points: 0 };
    const reports = reportsSnap.docs.map(doc => doc.data());
    const swaps = swapsSnap.docs.map(doc => doc.data());

    const totalReports = reports.length;
    const resolvedReports = reports.filter(r => r.status === 'Resolved').length;
    const totalSwaps = swaps.length;
    
    // Unique areas cleaned (based on resolved reports)
    const uniqueAreas = new Set(reports.filter(r => r.status === 'Resolved').map(r => r.location)).size;

    // Recent Activity (combine reports and swaps, sort by date)
    const activities = [
        ...reports.map(r => ({ type: 'report', title: 'Filed a report', detail: r.type, date: r.createdAt })),
        ...swaps.map(s => ({ type: 'swap', title: 'Listed an item', detail: s.itemName, date: s.createdAt }))
    ].sort((a, b) => (b.date?.seconds || 0) - (a.date?.seconds || 0)).slice(0, 5);

    res.json({
      points: userData.points || 0,
      totalReports,
      resolvedReports,
      totalSwaps,
      uniqueAreas,
      activities
    });
  } catch (err) {
    console.error("Impact API error:", err);
    sendError(res, 500, 'Failed to fetch impact data');
  }
});

// 12. Report Details & Timeline API
app.get('/api/report/:id', async (req, res) => {
  if (!db) return sendError(res, 500, 'Database error');
  try {
    const doc = await db.collection('reports').doc(req.params.id).get();
    if (!doc.exists) return sendError(res, 404, 'Report not found');
    res.json({ id: doc.id, ...doc.data() });
  } catch (err) {
    sendError(res, 500, 'Failed to fetch report');
  }
});

app.patch('/api/report/:id/status', verifyAuth, checkRole(['admin', 'agency']), async (req, res) => {
  const { status, label } = req.body;
  if (!db) return sendError(res, 500, 'Database error');
  
  try {
    const reportRef = db.collection('reports').doc(req.params.id);
    const reportDoc = await reportRef.get();
    if (!reportDoc.exists) return sendError(res, 404, 'Report not found');

    const now = admin.firestore.Timestamp.now();
    await reportRef.update({
      status,
      statusHistory: admin.firestore.FieldValue.arrayUnion({
        status,
        timestamp: now,
        label: label || `Status changed to ${status}`
      })
    });

    sendSuccess(res, { message: 'Status updated' });
  } catch (err) {
    sendError(res, 500, 'Failed to update status');
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
