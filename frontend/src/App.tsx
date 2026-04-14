import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, type User, signOut } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// Pages
import LandingPage from './pages/LandingPage';
import ReportIssue from './pages/ReportIssue';
import EcoSwap from './pages/EcoSwap';
import MapView from './pages/MapView';
import ProfilePage from './pages/ProfilePage';
import Dashboard from './pages/Dashboard';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import Leaderboard from './pages/Leaderboard';
import FeedbackPage from './pages/FeedbackPage';
import LearnPage from './pages/LearnPage';
import NotificationBell from './components/NotificationBell';

const Navbar = ({ user }: { user: User | null }) => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path ? 'active' : '';

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  return (
    <nav className="navbar">
      <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '2rem', fontWeight: '900', color: 'var(--primary-green)' }}>
        <img src="/logo.png" alt="CleanTown Logo" style={{ width: '54px', height: '54px', borderRadius: '12px', objectFit: 'cover', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
        CleanTown
      </Link>
      <div className="nav-links" style={{ display: 'flex', alignItems: 'center' }}>
        {!user && <Link to="/" className={isActive('/')}>Home</Link>}

        {user ? (
          <>
            <Link to="/map" className={isActive('/map')}>Dashboard</Link>
            <Link to="/report" className={isActive('/report')}>Report</Link>
            <Link to="/swap" className={isActive('/swap')}>Swap</Link>
            <Link to="/learn" className={isActive('/learn')}>Learn</Link>
            <Link to="/feedback" className={isActive('/feedback')}>Feedback</Link>
            <Link to="/dashboard" className={isActive('/dashboard')}>Live Map</Link>
            <Link to="/profile" className={isActive('/profile')}>Profile</Link>
            <Link to="/leaderboard" className={isActive('/leaderboard')}>Leaderboard</Link>
            <div style={{ marginRight: '1rem' }}>
              <NotificationBell userId={user.uid} />
            </div>
            <button onClick={handleLogout} className="btn-saffron" style={{ padding: '0.4rem 1rem', color: 'white', border: 'none', cursor: 'pointer' }}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/dashboard" className={isActive('/dashboard')}>Live Map</Link>
            <Link to="/report" className={isActive('/report')}>Report</Link>
            <Link to="/swap" className={isActive('/swap')}>Swap</Link>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Link to="/signup" className="btn-green" style={{ padding: '0.4rem 1rem', color: 'white' }}>Sign Up</Link>
              <Link to="/login" className="btn-saffron" style={{ padding: '0.4rem 1rem', color: 'white' }}>Login</Link>
            </div>
          </>
        )}
      </div>
    </nav>
  );
};

const LockedFeature = ({ featureName }: { featureName: string }) => (
  <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem', marginTop: '2rem', animation: 'fadeIn 0.5s ease' }}>
    <div style={{ width: '80px', height: '80px', borderRadius: '20px', overflow: 'hidden', margin: '0 auto 1.5rem auto', boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }}>
      <img src="/logo.png" alt="CleanTown" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    </div>
    <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--accent-blue)' }}>Oops! {featureName} is Locked</h2>
    <p style={{ color: '#6B7280', maxWidth: '500px', margin: '0 auto 2rem auto', fontSize: '1.1rem', lineHeight: '1.6' }}>
      Join our mission to keep our town clean! You need an account to view the {featureName.toLowerCase()} and start making an impact.
    </p>
    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
      <Link to="/login"><button className="btn-saffron" style={{ padding: '0.75rem 2rem' }}>Login to Unlock</button></Link>
      <Link to="/signup"><button className="btn-green" style={{ padding: '0.75rem 2rem' }}>Create Account</button></Link>
    </div>
  </div>
);

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      // Auto-sync profile to Firestore if logged in
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (!userDoc.exists()) {
            console.log("No Firestore profile found, creating one...");
            await setDoc(doc(db, "users", currentUser.uid), {
              id: currentUser.uid,
              name: currentUser.displayName || currentUser.email?.split('@')[0] || 'Citizen',
              email: currentUser.email,
              points: 0,
              createdAt: new Date().toISOString()
            });
          }
        } catch (err) {
          console.error("Profile sync error:", err);
        }
      }

      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return null; // Or a loading spinner

  return (
    <Router>
      <Navbar user={user} />
      <div className="container">
        <Routes>
          <Route path="/" element={user ? <Navigate to="/dashboard" /> : <LandingPage />} />
          <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <LoginPage />} />
          <Route path="/signup" element={user ? <Navigate to="/dashboard" /> : <SignupPage />} />
          <Route path="/report" element={user ? <ReportIssue /> : <LockedFeature featureName="Reporting System" />} />
          <Route path="/swap" element={user ? <EcoSwap /> : <LockedFeature featureName="Eco-Swap Marketplace" />} />
          <Route path="/map" element={user ? <Dashboard /> : <LockedFeature featureName="Impact Statistics" />} />
          <Route path="/leaderboard" element={user ? <Leaderboard /> : <LockedFeature featureName="Impact Leaderboard" />} />
          <Route path="/feedback" element={user ? <FeedbackPage /> : <LockedFeature featureName="Feedback System" />} />
          <Route path="/learn" element={user ? <LearnPage /> : <LockedFeature featureName="Learning Guide" />} />
          <Route path="/profile" element={user ? <ProfilePage /> : <Navigate to="/login" />} />
          <Route path="/dashboard" element={user ? <MapView /> : <Navigate to="/login" />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;

