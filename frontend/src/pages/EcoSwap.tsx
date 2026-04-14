import { useEffect, useState } from 'react';
import api from '../api';
import { auth } from '../firebase';
import { PlusCircle, Check } from 'lucide-react';

const EcoSwap = () => {
  const [swaps, setSwaps] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newItem, setNewItem] = useState({ itemName: '', description: '', location: '' });

  const fetchSwaps = async () => {
    try {
      const res = await api.get('/swaps');
      setSwaps(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSwaps();
    const interval = setInterval(fetchSwaps, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleList = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/swap/create', { ...newItem, ownerId: auth.currentUser?.uid });
      setNewItem({ itemName: '', description: '', location: '' });
      setShowForm(false);
      fetchSwaps();
    } catch (err) {
      console.error(err);
    }
  };

  const handleClaim = async (id: string) => {
    try {
      await api.post('/swap/claim', { swapId: id, userId: auth.currentUser?.uid });
      fetchSwaps();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Eco-Swap Marketplace</h1>
        <button className="btn-green" onClick={() => setShowForm(!showForm)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <PlusCircle size={20} /> List Item
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginTop: '2rem', marginBottom: '2rem' }}>
          <h3>List a Reusable Item</h3>
          <form onSubmit={handleList} style={{ marginTop: '1rem' }}>
            <label>Item Name</label>
            <input required value={newItem.itemName} onChange={e => setNewItem({...newItem, itemName: e.target.value})} placeholder="E.g., Wooden Desk" />
            
            <label>Description</label>
            <textarea value={newItem.description} onChange={e => setNewItem({...newItem, description: e.target.value})} placeholder="Condition, dimensions, etc." />
            
            <label>Pickup Location</label>
            <input required value={newItem.location} onChange={e => setNewItem({...newItem, location: e.target.value})} placeholder="Neighborhood or Street" />
            
            <button type="submit" className="btn-saffron">Post Item (+5 Pts)</button>
          </form>
        </div>
      )}

      <div className="grid-3" style={{ marginTop: '2rem' }}>
        {swaps.map(swap => (
          <div key={swap.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
               <h3 style={{ marginBottom: '0.5rem' }}>{swap.itemName}</h3>
               <span className={`badge ${swap.status === 'Available' ? 'resolved' : ''}`}>{swap.status}</span>
            </div>
            <p style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '1rem' }}>{swap.description}</p>
            <p style={{ fontSize: '0.875rem', fontWeight: 'bold' }}>Pickup: {swap.location}</p>
            
            {swap.status === 'Available' ? (
              <button onClick={() => handleClaim(swap.id)} className="btn-blue" style={{ width: '100%', marginTop: '1rem' }}>Claim Item</button>
            ) : (
              <button disabled className="btn-green" style={{ width: '100%', marginTop: '1rem', background: '#D1FAE5', color: 'var(--primary-green)' }}>
                <Check size={16} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }}/> Claimed
              </button>
            )}
          </div>
        ))}
        {swaps.length === 0 && <p>No items available right now.</p>}
      </div>
    </div>
  );
};

export default EcoSwap;
