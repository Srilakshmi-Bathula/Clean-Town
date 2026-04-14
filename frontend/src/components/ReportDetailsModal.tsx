import { X } from 'lucide-react';
import ReportTimeline from './ReportTimeline';

const ReportDetailsModal = ({ report, onClose }: { report: any, onClose: () => void }) => {
  if (!report) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      backdropFilter: 'blur(4px)',
      padding: '1rem'
    }} onClick={onClose}>
      <div style={{
        background: 'white',
        width: '100%',
        maxWidth: '500px',
        borderRadius: '24px',
        overflow: 'hidden',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)'
      }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F3F4F6' }}>
          <div>
             <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--accent-blue)' }}>Report Details</h2>
             <p style={{ margin: 0, fontSize: '0.85rem', color: '#6B7280' }}>ID: {report.id.substring(0, 8)}...</p>
          </div>
          <button onClick={onClose} style={{ background: '#F3F4F6', border: 'none', padding: '8px', borderRadius: '12px', cursor: 'pointer', color: '#6B7280' }}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '1.5rem', maxHeight: '80vh', overflowY: 'auto' }}>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
            {report.imageUrl && (
              <img 
                src={report.imageUrl} 
                alt="Reported Issue" 
                style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '12px' }} 
              />
            )}
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--primary-saffron)' }}>
                 {report.type}
              </div>
              <div style={{ margin: '4px 0', fontSize: '1rem', fontWeight: 'bold' }}>{report.location}</div>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#6B7280' }}>{report.description || 'No additional description provided.'}</p>
            </div>
          </div>

          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#1F2937' }}>Resolution Timeline</h3>
          <ReportTimeline 
            history={report.statusHistory || [
              { status: 'Reported', timestamp: report.createdAt, label: 'Issue submitted by citizen' }
            ]} 
            currentStatus={report.status} 
          />
        </div>

        {/* Footer */}
        <div style={{ padding: '1.5rem', background: '#F9FAFB', borderTop: '1px solid #F3F4F6', textAlign: 'center' }}>
          <button className="btn-green" style={{ width: '100%' }} onClick={onClose}>Close Details</button>
        </div>
      </div>
    </div>
  );
};

export default ReportDetailsModal;
