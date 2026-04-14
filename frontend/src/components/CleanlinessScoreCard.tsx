import { useEffect, useState } from 'react';
import { Shield, TrendingUp, Info } from 'lucide-react';
import api from '../api';

interface CleanlinessScore {
  score: number;
  totalReports: number;
  resolvedReports: number;
  area: string;
}

const CleanlinessScoreCard = ({ lat, lng }: { lat?: number; lng?: number }) => {
  const [data, setData] = useState<CleanlinessScore | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchScore = async () => {
      try {
        const params: any = {};
        if (lat && lng) {
          params.lat = lat;
          params.lng = lng;
        }
        const res = await api.get('/cleanliness-score', { params });
        setData(res.data);
      } catch (err) {
        console.error('Failed to fetch score:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchScore();
    // Refresh every minute for real-time feel
    const interval = setInterval(fetchScore, 60000);
    return () => clearInterval(interval);
  }, [lat, lng]);

  if (loading) return <div className="card loading-skeleton" style={{ height: '180px' }}></div>;
  if (!data) return null;

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10B981'; // Green
    if (score >= 50) return '#F59E0B'; // Saffron/Yellow
    return '#EF4444'; // Red
  };

  const scoreColor = getScoreColor(data.score);

  return (
    <div className="card" style={{ position: 'relative', overflow: 'hidden' }}>
      <div style={{ 
        position: 'absolute', 
        top: 0, 
        right: 0, 
        width: '100px', 
        height: '100px', 
        background: `radial-gradient(circle at top right, ${scoreColor}22, transparent)`,
        borderRadius: '0 0 0 100%'
      }}></div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '0.9rem', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Area Cleanliness
          </h3>
          <p style={{ margin: '0.25rem 0 0 0', fontWeight: 'bold', fontSize: '1.1rem' }}>{data.area}</p>
        </div>
        <div style={{ padding: '0.5rem', background: `${scoreColor}15`, borderRadius: '12px', color: scoreColor }}>
          <Shield size={24} />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem', marginBottom: '1rem' }}>
        <div style={{ fontSize: '3.5rem', fontWeight: '900', lineHeight: 1, color: scoreColor }}>
          {data.score}%
        </div>
        <div style={{ paddingBottom: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10B981', fontSize: '0.85rem', fontWeight: 'bold' }}>
            <TrendingUp size={14} /> +2% improvement
          </div>
          <div style={{ fontSize: '0.8rem', color: '#9CA3AF' }}>vs last week</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{ width: '100%', height: '8px', background: '#F3F4F6', borderRadius: '4px', marginBottom: '1.5rem', overflow: 'hidden' }}>
        <div style={{ 
          width: `${data.score}%`, 
          height: '100%', 
          background: `linear-gradient(to right, ${scoreColor}aa, ${scoreColor})`,
          borderRadius: '4px',
          transition: 'width 1s ease-out'
        }}></div>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem' }}>
        <div>
          <div style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>TOTAL REPORTS</div>
          <div style={{ fontWeight: 'bold' }}>{data.totalReports}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>RESOLVED</div>
          <div style={{ fontWeight: 'bold', color: '#10B981' }}>{data.resolvedReports}</div>
        </div>
        <div style={{ marginLeft: 'auto', alignSelf: 'center' }}>
            <Info size={16} color="#9CA3AF" style={{ cursor: 'pointer' }} />
        </div>
      </div>
    </div>
  );
};

export default CleanlinessScoreCard;
