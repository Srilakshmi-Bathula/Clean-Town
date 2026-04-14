import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, X, MapPin, Camera, AlertCircle } from 'lucide-react';
import api from '../api';
import { auth } from '../firebase';

const ReportIssue = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    type: 'trash',
    location: '',
    lat: null as number | null,
    lng: null as number | null,
    description: '',
    reporterName: auth.currentUser?.displayName || '',
    reporterEmail: auth.currentUser?.email || '',
    phone: '',
  });

  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);

  const fetchAddress = async (lat: number, lng: number) => {
    setGeoLoading(true);
    try {
      // Using OpenStreetMap Nominatim API (Free & No Key Required)
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
      const data = await res.json();
      const address = data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      setFormData(prev => ({ ...prev, location: address, lat, lng }));
    } catch (err) {
      console.error('Reverse Geocoding Error:', err);
      setFormData(prev => ({ ...prev, location: `${lat.toFixed(4)}, ${lng.toFixed(4)}`, lat, lng }));
    } finally {
      setGeoLoading(false);
    }
  };

  const handleMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        fetchAddress(pos.coords.latitude, pos.coords.longitude);
      });
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setPreview(null);
  };

  const [status, setStatus] = useState<'form' | 'success' | 'failed' | 'offline'>('form');
  const [errorMessage, setErrorMessage] = useState('');

  const isHazardousWaste = () => {
    const hazardousKeywords = ['plastic', 'glass', 'sharp', 'bottle', 'toxic', 'chemical', 'battery', 'metal', 'wire', 'needle'];
    const desc = formData.description.toLowerCase();
    return hazardousKeywords.some(keyword => desc.includes(keyword)) || formData.type === 'smoke';
  };

  const submitReport = async (payload: any = null) => {
    setLoading(true);
    setStatus('form');
    setErrorMessage('');

    const reportPayload = payload || {
      ...formData,
      imageUrl: preview || '',
      userId: auth.currentUser?.uid || 'anonymous',
      isHazardous: isHazardousWaste(),
      createdAt: new Date().toISOString()
    };

    if (!navigator.onLine) {
      // Offline fallback
      const offlineReports = JSON.parse(localStorage.getItem('offlineReports') || '[]');
      offlineReports.push(reportPayload);
      localStorage.setItem('offlineReports', JSON.stringify(offlineReports));
      setStatus('offline');
      setLoading(false);
      return;
    }

    try {
      await api.post('/report', reportPayload);
      setStatus('success');
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err: any) {
      console.error('Failed to report issue', err);
      setStatus('failed');
      if (err.response) {
        setErrorMessage(`Server Error: ${err.response.data?.error || err.response.status}`);
      } else if (err.request) {
        setErrorMessage('Server not reachable or request timeout.');
      } else {
        setErrorMessage('Network error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    submitReport();
  };

  if (status === 'success') {
    return (
      <div style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center' }}>
        <div className="card" style={{ padding: '3rem' }}>
          <div className="success-checkmark">
              <div className="check-icon">
                <span className="icon-line line-tip"></span>
                <span className="icon-line line-long"></span>
                <div className="icon-circle"></div>
                <div className="icon-fix"></div>
              </div>
          </div>
          <h2 style={{ color: 'var(--primary-green)', marginTop: '1rem' }}>Report Submitted!</h2>
          <p style={{ margin: '1rem 0', color: '#6B7280' }}>Your issue has been recorded. Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center' }}>
        <div className="card" style={{ padding: '3rem' }}>
          <div className="error-cross"></div>
          <h2 style={{ marginTop: '1rem', color: 'var(--danger-red)' }}>Report Failed</h2>
          <p style={{ margin: '1rem 0', color: '#6B7280' }}>{errorMessage}</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
            <button className="btn-saffron" onClick={() => submitReport()} disabled={loading}>
              {loading ? 'Retrying...' : 'Try Again'}
            </button>
            <button className="btn-green" onClick={() => setStatus('form')} disabled={loading}>
              Cancel / Edit
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'offline') {
    return (
      <div style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center' }}>
        <div className="card" style={{ padding: '3rem' }}>
           <AlertCircle size={64} color="var(--primary-saffron)" style={{ margin: '0 auto' }} />
          <h2 style={{ marginTop: '1rem', color: 'var(--primary-saffron)' }}>You are Offline</h2>
          <p style={{ margin: '1rem 0', color: '#6B7280' }}>
            Your device has no internet connection. We have saved your report locally and will sync it when you are back online.
          </p>
          <button className="btn-green" onClick={() => navigate('/dashboard')} style={{ marginTop: '1rem' }}>
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto' }}>
      <h1 className="page-title">Report an Issue</h1>
      
      <div className="card">
        <form onSubmit={handleSubmit}>
          <label>Issue Type</label>
          <select 
            value={formData.type} 
            onChange={(e) => setFormData({...formData, type: e.target.value})}
            required
            style={{ marginBottom: '1.5rem' }}
          >
            <option value="trash">Illegal Dumping / Trash</option>
            <option value="full-bin">Overflowing Bin</option>
            <option value="smoke">Smoke / Fire Hazard (EMERGENCY)</option>
            <option value="other">Other</option>
          </select>

          {formData.type === 'smoke' && (
             <div style={{ padding: '1rem', background: '#FEE2E2', color: 'var(--danger-red)', borderRadius: '12px', marginBottom: '1.5rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.75rem', border: '1px solid #FCA5A5' }}>
               <AlertCircle size={24} />
               <span>WARNING: This is an emergency hazard. Authorities will be notified immediately.</span>
             </div>
          )}

          {isHazardousWaste() && formData.type !== 'smoke' && (
            <div style={{ padding: '1rem', background: '#FFF7ED', color: '#9A3412', borderRadius: '12px', marginBottom: '1.5rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.75rem', border: '1px solid #FFEDD5', animation: 'fadeIn 0.5s ease' }}>
              <AlertCircle size={24} color="#EA580C" />
              <div>
                <span style={{ display: 'block', fontSize: '1rem' }}>🐄 COW-SAFE ALERT</span>
                <span style={{ fontWeight: '400', fontSize: '0.85rem' }}>Warning: This waste contains materials (plastic/sharp objects) that are harmful to animals if consumed. Marker will be flagged as hazardous.</span>
              </div>
            </div>
          )}

          <label>Full Name</label>
          <input 
            type="text" 
            placeholder="Your Name" 
            value={formData.reporterName}
            onChange={(e) => setFormData({...formData, reporterName: e.target.value})}
            required 
            style={{ marginBottom: '1.5rem' }}
          />

          <label>Email Address</label>
          <input 
            type="email" 
            placeholder="your@email.com" 
            value={formData.reporterEmail}
            onChange={(e) => setFormData({...formData, reporterEmail: e.target.value})}
            style={{ marginBottom: '1.5rem' }}
          />

          <label>Phone Number</label>
          <input 
            type="tel" 
            placeholder="Contact Number" 
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
            required 
            style={{ marginBottom: '1.5rem' }}
          />

          <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            Location
            <button 
              type="button" 
              onClick={handleMyLocation}
              disabled={geoLoading}
              className="btn-green"
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <MapPin size={16} /> {geoLoading ? 'Locating...' : 'Use My Location'}
            </button>
          </label>
          <input 
            type="text" 
            placeholder="Search address or use current location..." 
            value={formData.location}
            onChange={(e) => setFormData({...formData, location: e.target.value})}
            required 
            style={{ marginBottom: '1.5rem' }}
          />

          <label>Description</label>
          <textarea 
            rows={4} 
            placeholder="Tell us more about the issue... (e.g., 'Behind the school park')" 
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            style={{ marginBottom: '1.5rem' }}
          />

          <label>Photo Evidence</label>
          {!preview ? (
            <div 
              className="dropzone" 
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files[0];
                if (file) {
                  setPreview(URL.createObjectURL(file));
                }
              }}
            >
              <Camera size={48} color="#9CA3AF" />
              <p style={{ fontWeight: '600', color: '#4B5563' }}>Upload a photo or drag & drop</p>
              <p style={{ fontSize: '0.875rem', color: '#9CA3AF' }}>PNG, JPG or JPEG allowed</p>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageChange} 
                accept="image/*" 
                hidden 
              />
            </div>
          ) : (
            <div className="preview-container">
              <img src={preview} alt="Report Preview" className="preview-img" />
              <div className="remove-img" onClick={removeImage}>
                <X size={16} />
              </div>
            </div>
          )}

          <button 
            type="submit" 
            className="btn-saffron" 
            style={{ width: '100%', padding: '1.25rem', fontSize: '1.1rem', marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }} 
            disabled={loading}
          >
            <Upload size={20} />
            {loading ? 'Submitting Report...' : 'Submit Report (+50 Points)'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ReportIssue;
