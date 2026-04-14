import { useEffect, useState } from 'react';
import { Award, FileText, CheckCircle, Repeat, Target, Clock, Star } from 'lucide-react';
import api from '../api';

interface ImpactData {
  points: number;
  totalReports: number;
  resolvedReports: number;
  totalSwaps: number;
  uniqueAreas: number;
  activities: {
    type: string;
    title: string;
    detail: string;
    date: { seconds: number; nanoseconds: number } | null;
  }[];
}

const ImpactDashboard = ({ userId }: { userId: string }) => {
  const [data, setData] = useState<ImpactData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchImpact = async () => {
      try {
        const res = await api.get(`/user/impact/${userId}`);
        setData(res.data);
      } catch (err) {
        console.error('Failed to fetch impact data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchImpact();
  }, [userId]);

  if (loading) return <div className="card loading-skeleton" style={{ height: '300px' }}></div>;
  if (!data) return null;

  const getPointsToNextBadge = () => {
    if (data.points < 100) return 100 - data.points;
    if (data.points < 500) return 500 - data.points;
    if (data.points < 1000) return 1000 - data.points;
    return 0;
  };

  const getNextBadgeName = () => {
    if (data.points < 100) return "Clean Starter";
    if (data.points < 500) return "Eco Warrior";
    if (data.points < 1000) return "City Champion";
    return "Green Legend";
  };

  const progress = (data.points / (data.points + getPointsToNextBadge())) * 100;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Stats Row */}
      <div className="grid-4" style={{ gap: '1rem' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ color: 'var(--primary-saffron)', marginBottom: '0.5rem', display: 'flex', justifyContent: 'center' }}>
            <FileText size={24} />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{data.totalReports}</div>
          <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>REPORTS FILED</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ color: 'var(--primary-green)', marginBottom: '0.5rem', display: 'flex', justifyContent: 'center' }}>
            <CheckCircle size={24} />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{data.resolvedReports}</div>
          <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>ISSUES RESOLVED</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ color: 'var(--accent-blue)', marginBottom: '0.5rem', display: 'flex', justifyContent: 'center' }}>
            <Repeat size={24} />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{data.totalSwaps}</div>
          <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>ITEMS SWAPPED</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ color: 'var(--primary-saffron)', marginBottom: '0.5rem', display: 'flex', justifyContent: 'center' }}>
            <Award size={24} />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{data.points}</div>
          <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>POINTS EARNED</div>
        </div>
      </div>

      <div className="grid-2" style={{ gap: '2rem' }}>
        {/* Impact Summary */}
        <div className="card" style={{ background: 'linear-gradient(135deg, #13880811 0%, #ffffff 100%)' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem' }}>
            <Target size={20} color="var(--primary-green)" /> Your Impact
          </h3>
          <div style={{ marginBottom: '1.5rem' }}>
            <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>You've helped clean <strong>{data.uniqueAreas} different areas</strong> in CleanTown.</p>
            <p style={{ color: '#6B7280', fontSize: '0.9rem' }}>That's more than {(data.totalReports > 0 ? 65 : 0)}% of citizens!</p>
          </div>

          <div style={{ padding: '1rem', background: '#F0FDF4', borderRadius: '12px', border: '1px solid #DCFCE7' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 'bold' }}>
               <span>Current Rank: {getNextBadgeName()}</span>
               <span>{data.points} / {data.points + getPointsToNextBadge()} pts</span>
             </div>
             <div style={{ width: '100%', height: '8px', background: '#DCFCE7', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${progress}%`, height: '100%', background: 'var(--primary-green)', borderRadius: '4px', transition: 'width 1s ease' }}></div>
             </div>
             {getPointsToNextBadge() > 0 && (
               <p style={{ fontSize: '0.75rem', color: '#166534', marginTop: '8px' }}>
                 Earn {getPointsToNextBadge()} more points to reach <strong>Next Level</strong>
               </p>
             )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem' }}>
            <Clock size={20} color="var(--accent-blue)" /> Recent Activity
          </h3>
          {data.activities.length === 0 ? (
            <p style={{ color: '#9CA3AF', textAlign: 'center', padding: '1rem' }}>No recent activity to show.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {data.activities.map((act, id) => (
                <div key={id} style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ 
                    width: '32px', 
                    height: '32px', 
                    borderRadius: '50%', 
                    background: act.type === 'report' ? '#FEF3C7' : '#DBEAFE',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {act.type === 'report' ? <FileText size={16} color="var(--primary-saffron)" /> : <Star size={16} color="var(--accent-blue)" />}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{act.title}</div>
                    <div style={{ fontSize: '0.8rem', color: '#6B7280' }}>{act.detail}</div>
                  </div>
                  <div style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#9CA3AF' }}>
                    {act.date ? new Date(act.date.seconds * 1000).toLocaleDateString() : 'Today'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImpactDashboard;
