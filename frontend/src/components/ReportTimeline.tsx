import { MapPin, Wrench, CheckCircle, Clock } from 'lucide-react';

interface HistoryItem {
  status: string;
  timestamp: { seconds: number; nanoseconds: number } | string;
  label: string;
}

const ReportTimeline = ({ history = [], currentStatus }: { history: HistoryItem[], currentStatus: string }) => {
  const steps = [
    { id: 'Reported', icon: <MapPin size={18} />, color: '#F59E0B' },
    { id: 'In Progress', icon: <Wrench size={18} />, color: '#3B82F6' },
    { id: 'Resolved', icon: <CheckCircle size={18} />, color: '#10B981' }
  ];

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '...';
    if (typeof timestamp === 'string') return new Date(timestamp).toLocaleDateString();
    return new Date(timestamp.seconds * 1000).toLocaleDateString();
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    if (typeof timestamp === 'string') return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return new Date(timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={{ padding: '1rem 0' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
        {steps.map((step, index) => {
          const entry = history.find(h => h.status.toLowerCase() === step.id.toLowerCase());
          const isCompleted = !!entry;
          const isLast = index === steps.length - 1;
          const isActive = currentStatus.toLowerCase() === step.id.toLowerCase();

          return (
            <div key={step.id} style={{ display: 'flex', gap: '1.5rem', minHeight: '80px' }}>
              {/* Line & Icon Column */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ 
                  width: '36px', 
                  height: '36px', 
                  borderRadius: '12px', 
                  background: isCompleted ? step.color : '#F3F4F6',
                  color: isCompleted ? 'white' : '#9CA3AF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 2,
                  boxShadow: isActive ? `0 0 0 4px ${step.color}33` : 'none',
                  transition: 'all 0.3s ease'
                }}>
                  {step.icon}
                </div>
                {!isLast && (
                  <div style={{ 
                    flex: 1, 
                    width: '3px', 
                    background: isCompleted && history[index+1] ? step.color : '#F3F4F6', 
                    margin: '4px 0',
                    borderRadius: '2px'
                  }}></div>
                )}
              </div>

              {/* Content Column */}
              <div style={{ paddingBottom: '1.5rem', flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h4 style={{ margin: 0, color: isCompleted ? '#1F2937' : '#9CA3AF', fontSize: '1rem', fontWeight: isActive ? '800' : '600' }}>
                    {step.id}
                  </h4>
                  {isCompleted && (
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{formatDate(entry?.timestamp)}</div>
                      <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>{formatTime(entry?.timestamp)}</div>
                    </div>
                  )}
                </div>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: isCompleted ? '#6B7280' : '#D1D5DB' }}>
                  {entry?.label || (isActive ? 'Currently processing...' : 'Pending stage')}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      
      <div style={{ marginTop: '1rem', padding: '1rem', background: '#F9FAFB', borderRadius: '12px', border: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Clock size={16} color="#6B7280" />
        <span style={{ fontSize: '0.8rem', color: '#6B7280' }}>
            Current Status: <strong style={{ color: 'var(--primary-green)' }}>{currentStatus}</strong>
        </span>
      </div>
    </div>
  );
};

export default ReportTimeline;
