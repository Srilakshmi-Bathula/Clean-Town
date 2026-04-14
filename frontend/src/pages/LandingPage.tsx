import { Link } from 'react-router-dom';
import { Leaf, Map, Repeat, Award, ArrowRight, ShieldAlert, Flame, X, Loader2, AlertTriangle, Camera } from 'lucide-react';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '../firebase';

const LandingPage = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [reporterName, setReporterName] = useState('');
  const [manualLocation, setManualLocation] = useState('');
  const [status, setStatus] = useState<'idle' | 'form' | 'reporting' | 'success' | 'failed'>('idle');
  const [photo, setPhoto] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const openEmergencyForm = () => {
    setIsDetecting(true);
    setStatus('form');
    setPhoto(null);
    setReporterName('');
    setManualLocation('Detecting location...');

    // Pre-fill location with Reverse Geocoding
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          setManualLocation(data.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        } catch (err) {
          setManualLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        }
      },
      () => setManualLocation('Manual entry required (Location denied)')
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const sendReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('reporting');
    
    const reportData = {
      name: reporterName || 'Anonymous',
      location: manualLocation,
      photo: photo,
      timestamp: new Date().toISOString(),
      smokeLevel: 'Manual Report',
      status: 'Emergency'
    };

    try {
      // Connect directly to Firebase Database instead of local Node.js API
      const { collection, addDoc } = await import('firebase/firestore');
      const { db } = await import('../firebase');
      
      await addDoc(collection(db, 'emergency_reports'), reportData);
      
      // We assume it's successful if addDoc didn't throw an error
      setStatus('success');
    } catch (err) {
      console.error("Firebase Database Connection Error:", err);
      setStatus('failed');
    }
  };

  const closeOverlay = () => {
    setIsDetecting(false);
    setStatus('idle');
  };

  return (
    <div>
      {/* Emergency Form Overlay */}
      {isDetecting && (
        <div className="emergency-overlay">
          <button onClick={closeOverlay} style={{ position: 'absolute', top: '2rem', right: '2rem', background: 'transparent', color: 'white' }}>
            <X size={40} />
          </button>

          {status === 'form' && (
            <div className="card" style={{ background: 'white', color: 'var(--accent-blue)', padding: '2rem', width: '100%', maxWidth: '500px', borderRadius: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', color: 'var(--danger-red)' }}>
                <AlertTriangle size={32} />
                <h2 style={{ margin: 0 }}>Emergency Report</h2>
              </div>
              
              <form onSubmit={sendReport}>
                <div style={{ textAlign: 'left' }}>
                  <label>Your Name</label>
                  <input 
                    type="text" 
                    placeholder="Enter your name" 
                    required 
                    value={reporterName} 
                    onChange={(e) => setReporterName(e.target.value)}
                  />
                  
                  <label>Location</label>
                  <input 
                    type="text" 
                    placeholder="Where is the smoke?" 
                    required 
                    value={manualLocation} 
                    onChange={(e) => setManualLocation(e.target.value)}
                  />
                  
                  <label>Evidence Image</label>
                  <div className="dropzone" style={{ padding: '1rem' }} onClick={() => document.getElementById('emergency-upload')?.click()}>
                    {photo ? (
                      <img src={photo} alt="Preview" style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '12px' }} />
                    ) : (
                      <>
                        <Camera size={24} color="#6B7280" />
                        <p style={{ fontSize: '0.875rem' }}>Upload Photo</p>
                      </>
                    )}
                    <input 
                      id="emergency-upload"
                      type="file" 
                      accept="image/*" 
                      style={{ display: 'none' }} 
                      onChange={handleFileChange}
                    />
                  </div>
                </div>

                <button type="submit" className="btn-emergency" style={{ width: '100%', marginTop: '1rem', padding: '1rem' }}>
                  Send Emergency Report
                </button>
              </form>
            </div>
          )}

          {status === 'reporting' && (
            <>
              <Loader2 size={60} className="animate-spin" />
              <h2 style={{ marginTop: '2rem' }}>Transmitting Report...</h2>
            </>
          )}

          {status === 'success' && (
            <div className="card" style={{ background: 'white', color: 'var(--accent-blue)', padding: '3rem', maxWidth: '500px', borderRadius: '24px' }}>
              <div className="success-checkmark">
                <div className="check-icon">
                  <span className="icon-line line-tip"></span>
                  <span className="icon-line line-long"></span>
                  <div className="icon-circle"></div>
                  <div className="icon-fix"></div>
                </div>
              </div>
              <h2 style={{ color: 'var(--primary-green)' }}>Report Sent!</h2>
              <p style={{ margin: '1.5rem 0', fontSize: '1.1rem' }}>Emergency report filed successfully. Authorities have been notified.</p>
              <button className="btn-green" onClick={closeOverlay} style={{ width: '100%', padding: '1rem' }}>Close</button>
            </div>
          )}

          {status === 'failed' && (
            <div className="card" style={{ background: 'white', color: 'var(--accent-blue)', padding: '3rem', maxWidth: '500px', borderRadius: '24px' }}>
              <div className="error-cross"></div>
              <h2>Report Failed</h2>
              <p style={{ margin: '1rem 0' }}>Could not connect to the server. Please try again.</p>
              <button className="btn-saffron" onClick={() => setStatus('form')} style={{ width: '100%' }}>Try Again</button>
            </div>
          )}
        </div>
      )}

      {/* Hero Section */}
      <section className="hero">
        <Leaf size={64} color="var(--primary-saffron)" style={{ marginBottom: '1.5rem' }} />
        <h1>Report Waste. Earn Rewards.<br />Clean Your City.</h1>
        <p>
          Join your community to report waste, track cleaning progress, and list reusable items. 
          Every contribution makes your city a better place to live.
        </p>
        
        {!user && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '3rem' }}>
            <button className="btn-emergency" onClick={openEmergencyForm}>
              <Flame fill="white" /> EMERGENCY: SMOKE DETECTED
            </button>
          </div>
        )}

        <div className="hero-btns">
          {user ? (
            <Link to="/dashboard">
              <button className="btn-saffron" style={{ padding: '1rem 2.5rem', fontSize: '1.1rem' }}>Go to Dashboard</button>
            </Link>
          ) : (
            <Link to="/signup">
              <button className="btn-saffron" style={{ padding: '1rem 2.5rem', fontSize: '1.1rem' }}>Get Started</button>
            </Link>
          )}
          <Link to="/report">
            <button className="btn-green" style={{ padding: '1rem 2.5rem', fontSize: '1.1rem' }}>Report Now</button>
          </Link>
          <Link to="/map">
            <button className="btn-blue" style={{ padding: '1rem 2.5rem', fontSize: '1.1rem' }}>View Live Map</button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section>
        <h2 className="section-title">Why CleanTown?</h2>
        <div className="feature-grid">
          <div className="feature-card">
            <div className="icon-box">
              <ShieldAlert size={32} />
            </div>
            <h3>Smart Reporting</h3>
            <p>Report illegal dumping, full bins, or smoke hazards instantly with your location.</p>
          </div>
          <div className="feature-card">
            <div className="icon-box">
              <Map size={32} />
            </div>
            <h3>Live tracking</h3>
            <p>See real-time status of reports across the city and watch as areas get resolved.</p>
          </div>
          <div className="feature-card">
            <div className="icon-box">
              <Repeat size={32} />
            </div>
            <h3>Eco-Swap</h3>
            <p>Reduce waste by listing items you no longer need for others to claim.</p>
          </div>
          <div className="feature-card">
            <div className="icon-box">
              <Award size={32} />
            </div>
            <h3>Reward System</h3>
            <p>Earn points for every positive action and redeem them for community perks.</p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works">
        <h2 className="section-title">How It Works</h2>
        <div className="step-container">
          <div className="step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h3>Report Waste</h3>
              <p>Snap a photo and share your GPS location. Whether it's a full bin or illegal dumping, we've got you covered.</p>
            </div>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h3>System Alert</h3>
              <p>Our backend processes the report and immediately alerts city authorities or community cleanup crews.</p>
            </div>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h3>Get Rewarded</h3>
              <p>Once the area is cleaned and resolved, you receive reward points added straight to your profile.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-banner">
        <h2>Start Making Your City<br />Cleaner Today</h2>
        <Link to={user ? "/dashboard" : "/signup"}>
          <button className="btn-saffron" style={{ padding: '1.25rem 3rem', fontSize: '1.2rem', display: 'inline-flex', alignItems: 'center', gap: '0.75rem' }}>
            {user ? 'Go to Dashboard' : 'Get Started'} <ArrowRight size={24} />
          </button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div>
            <div className="footer-brand">
              <Leaf size={32} color="var(--primary-saffron)" />
              <span>CleanTown</span>
            </div>
            <p style={{ color: '#9CA3AF', maxWidth: '300px', lineHeight: '1.6' }}>
              Empowering citizens to build cleaner, more sustainable communities through technology and rewards.
            </p>
          </div>
          <div className="footer-links">
            <h4>Application</h4>
            <ul>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/report">Report Issue</Link></li>
              <li><Link to="/map">Map View</Link></li>
              <li><Link to="/swap">Eco-Swap</Link></li>
            </ul>
          </div>
          <div className="footer-links">
            <h4>Company</h4>
            <ul>
              <li><Link to="/learn">Learn More</Link></li>
              <li><Link to={user ? "/profile" : "/login"}>My Profile</Link></li>
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Terms of Service</a></li>
            </ul>
          </div>
          <div className="footer-links">
            <h4>Contact</h4>
            <p style={{ color: '#9CA3AF' }}>support@cleantown.com</p>
            <p style={{ color: '#9CA3AF' }}>+1 (555) 123-4567</p>
          </div>
        </div>
        <div style={{ marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.1)', textAlign: 'center', color: '#6B7280', fontSize: '0.875rem' }}>
          &copy; 2026 CleanTown. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

