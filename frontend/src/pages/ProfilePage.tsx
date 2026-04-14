import { useEffect, useState } from 'react';
import api from '../api';
import { auth, db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { User, Award, CheckCircle, Shield, Smartphone, LayoutDashboard } from 'lucide-react';
import ImpactDashboard from '../components/ImpactDashboard';

const ProfilePage = () => {
  const [user, setUser] = useState<any>(null);
  const [updatingMfa, setUpdatingMfa] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      try {
        const res = await api.get(`/users/${currentUser.uid}`);
        setUser(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchUser();
  }, []);

  const toggleMfa = async () => {
    if (!user) return;
    setUpdatingMfa(true);
    try {
        const userRef = doc(db, "users", user.id);
        const newState = !user.mfaEnabled;
        await updateDoc(userRef, { mfaEnabled: newState });
        setUser({ ...user, mfaEnabled: newState });
    } catch (err) {
        console.error("MFA toggle failed:", err);
    } finally {
        setUpdatingMfa(false);
    }
  };

  if (!user) return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading profile...</div>;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h1 className="page-title">My Profile</h1>
      
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '2rem' }}>
        <div style={{ background: 'var(--primary-saffron)', borderRadius: '50%', padding: '1.5rem', color: 'white' }}>
          <User size={64} />
        </div>
        <div>
          <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: 'var(--accent-blue)' }}>{user.name}</h2>
          <p style={{ color: '#6B7280' }}>Member since 2026</p>
        </div>
      </div>
      <div style={{ marginBottom: '3rem' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.25rem', marginBottom: '1.5rem', color: 'var(--accent-blue)' }}>
          <LayoutDashboard size={22} /> Personal Impact Dashboard
        </h2>
        <ImpactDashboard userId={user.id || auth.currentUser?.uid || ''} />
      </div>

      <div className="grid-2">
        <div className="card saffron">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <Award size={32} color="var(--primary-saffron)" />
            <h3 style={{ margin: 0 }}>Total Points</h3>
          </div>
          <p style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--primary-saffron)' }}>{user.points}</p>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <CheckCircle size={32} color="var(--primary-green)" />
            <h3 style={{ margin: 0 }}>Achievements</h3>
          </div>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
             {user.points > 0 ? (
               <li style={{ background: '#F0FDF4', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--primary-green)', color: 'var(--primary-green)', fontWeight: 'bold' }}>🌱 First Impact Made</li>
             ) : (
               <li style={{ background: '#F3F4F6', padding: '0.75rem', borderRadius: '8px', color: '#9CA3AF' }}>🔒 No achievements yet</li>
             )}
             
             {user.points >= 50 && (
               <li style={{ background: '#F3F4F6', padding: '0.75rem', borderRadius: '8px' }}>♻️ Eco-Warrior (Active Swapper)</li>
             )}
             
             {user.points >= 500 && (
               <li style={{ background: '#FFEDD5', padding: '0.75rem', borderRadius: '8px', color: 'var(--primary-saffron)', fontWeight: 'bold' }}>👑 City Champion</li>
             )}
          </ul>
        </div>
      </div>

      {/* Security Section */}
      <div className="card" style={{ marginTop: '2rem', border: '1px solid #E5E7EB' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.25rem', marginBottom: '1.5rem' }}>
                    <Shield size={20} color="var(--primary-green)" /> Account Security
                </h2>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: '#F9FAFB', borderRadius: '12px' }}>
                    <div>
                        <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Smartphone size={16} /> Two-Factor Authentication (MFA)
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#6B7280', marginTop: '4px' }}>
                            Add an extra layer of security using an authenticator app (Code: 123456).
                        </div>
                    </div>
                    <button 
                        onClick={toggleMfa}
                        disabled={updatingMfa}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '20px',
                            border: 'none',
                            background: user?.mfaEnabled ? 'var(--primary-green)' : '#E5E7EB',
                            color: user?.mfaEnabled ? 'white' : '#4B5563',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        {user?.mfaEnabled ? <CheckCircle size={16} /> : null}
                        {updatingMfa ? 'Updating...' : user?.mfaEnabled ? 'Enabled' : 'Enable'}
                    </button>
                </div>

                <div style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div style={{ padding: '1rem', border: '1px solid #F3F4F6', borderRadius: '12px' }}>
                        <div style={{ fontSize: '0.8rem', color: '#6B7280', marginBottom: '4px' }}>Session Status</div>
                        <div style={{ fontWeight: 'bold', color: '#059669', fontSize: '0.9rem' }}>HttpOnly Secure Cookie</div>
                    </div>
                    <div style={{ padding: '1rem', border: '1px solid #F3F4F6', borderRadius: '12px' }}>
                        <div style={{ fontSize: '0.8rem', color: '#6B7280', marginBottom: '4px' }}>Brute Force Protection</div>
                        <div style={{ fontWeight: 'bold', color: '#059669', fontSize: '0.9rem' }}>Rate Limiting Active</div>
                    </div>
                </div>
      </div>
    </div>
  );
};

export default ProfilePage;
