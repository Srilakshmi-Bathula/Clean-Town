import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, MapPin } from 'lucide-react';
import api from '../api';
import CleanlinessScoreCard from '../components/CleanlinessScoreCard';
import ReportDetailsModal from '../components/ReportDetailsModal';
import { auth } from '../firebase';

const Dashboard = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [swaps, setSwaps] = useState<any[]>([]);
  const [allReports, setAllReports] = useState<any[]>([]);
  const [allSwaps, setAllSwaps] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [selectedReport, setSelectedReport] = useState<any>(null);

  const resolvedCount = allReports.filter(r => r.status === 'Resolved').length;
  const swappedCount = allSwaps.filter(s => s.status === 'Claimed').length;
  
  // Helper to extract name from email if everything else fails
  const getGreetingName = () => {
    if (user?.name) return user.name;
    const currentUser = auth.currentUser;
    if (currentUser?.displayName) return currentUser.displayName;
    return null; // Don't fall back to email prefix immediately
  };

  useEffect(() => {
    const fetchData = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      try {
        const [reportsRes, swapsRes, userRes] = await Promise.all([
          api.get('/reports'),
          api.get('/swaps'),
          api.get(`/users/${currentUser.uid}`).catch(() => ({ data: null }))
        ]);
        
        const rData = reportsRes.data || [];
        const sData = swapsRes.data || [];
        
        setAllReports(rData);
        setAllSwaps(sData);
        setReports(rData.slice(-3).reverse());
        setSwaps(sData.slice(-3).reverse());
        setUser(userRes.data);
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <h1 className="page-title">
        {loadingData ? 'Welcome back...' : `Welcome back, ${getGreetingName() || 'Citizen'}!`}
      </h1>

      {selectedReport && (
        <ReportDetailsModal 
           report={selectedReport} 
           onClose={() => setSelectedReport(null)} 
        />
      )}
      
      <div className="grid-3" style={{ marginBottom: '3rem' }}>
        <div className="card saffron">
          <h3>Your Points</h3>
          <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--primary-saffron)' }}>{user?.points || 0}</p>
          <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>Earn points by reporting and swapping!</p>
        </div>
        
        <div className="card">
          <h3>Local Impact</h3>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <div>
              <p style={{ fontWeight: 'bold', fontSize: '1.5rem' }}>{resolvedCount}</p>
              <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>Issues Resolved</p>
            </div>
            <div>
              <p style={{ fontWeight: 'bold', fontSize: '1.5rem' }}>{swappedCount}</p>
              <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>Items Swapped</p>
            </div>
          </div>
        </div>

        <div className="card emergency">
          <h3>Quick Action</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
            <Link to="/report"><button className="btn-saffron" style={{ width: '100%' }}>Report Issue</button></Link>
            <Link to="/swap"><button className="btn-green" style={{ width: '100%' }}>Swap Items</button></Link>
          </div>
        </div>
      </div>
      <div style={{ marginBottom: '3rem' }}>
        <CleanlinessScoreCard />
      </div>

      <div className="grid-2">
        <div>
          <h2 style={{ marginBottom: '1rem', color: 'var(--accent-blue)' }}>Recent Reports</h2>
          {reports.length === 0 && <p>No recent reports in your area.</p>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {reports.map((report) => (
              <div 
                key={report.id} 
                className={`card ${report.isEmergency ? 'emergency' : ''}`} 
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                onClick={() => setSelectedReport(report)}
              >
                <div>
                  <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {report.isEmergency && <AlertTriangle size={16} color="var(--danger-red)" />}
                    {report.type.toUpperCase()}
                  </h4>
                  <p style={{ fontSize: '0.875rem', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <MapPin size={14} /> {report.location}
                  </p>
                </div>
                <span className={`badge ${report.status === 'Resolved' ? 'resolved' : report.status === 'Reported' ? 'saffron' : ''}`}>
                  {report.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 style={{ marginBottom: '1rem', color: 'var(--accent-blue)' }}>Recent Eco-Swaps</h2>
          {swaps.length === 0 && <p>No items listed yet.</p>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {swaps.map((swap) => (
              <div key={swap.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4>{swap.itemName}</h4>
                  <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>Added today</p>
                </div>
                <span className={`badge ${swap.status === 'Available' ? 'resolved' : ''}`}>
                  {swap.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
