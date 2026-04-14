import { useState } from 'react';
import { MessageSquare, Star, Send } from 'lucide-react';
import api from '../api';
import { auth } from '../firebase';

const FeedbackPage = () => {
    const [rating, setRating] = useState(5);
    const [category, setCategory] = useState('suggestion');
    const [message, setMessage] = useState('');
    const [anonymous, setAnonymous] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/feedback', {
                rating,
                category,
                message,
                userId: anonymous ? 'anonymous' : auth.currentUser?.uid,
                userName: anonymous ? 'Anonymous' : auth.currentUser?.displayName || 'Citizen',
                createdAt: new Date().toISOString()
            });
            setSuccess(true);
            setMessage('');
        } catch (err) {
            console.error(err);
            alert("Failed to submit feedback. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                <div style={{ background: '#F0FDF4', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
                    <MessageSquare size={40} color="var(--primary-green)" />
                </div>
                <h2 style={{ color: 'var(--primary-green)' }}>Thank You!</h2>
                <p style={{ margin: '1rem 0 2rem 0', color: '#6B7280' }}>Your feedback helps us make CleanTown even better for everyone.</p>
                <button className="btn-green" onClick={() => setSuccess(false)}>Send Another Message</button>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h1 className="page-title">Community Feedback</h1>
            <p style={{ marginBottom: '2rem', color: '#6B7280' }}>Have an idea, found a bug, or just want to tell us how we're doing? We'd love to hear from you!</p>

            <form className="card" onSubmit={handleSubmit}>
                <div style={{ marginBottom: '2rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Rating</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                            <Star 
                                key={star}
                                size={32}
                                onClick={() => setRating(star)}
                                fill={star <= rating ? "var(--primary-saffron)" : "none"}
                                color={star <= rating ? "var(--primary-saffron)" : "#D1D5DB"}
                                style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            />
                        ))}
                    </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <label>What's this about?</label>
                    <select value={category} onChange={(e) => setCategory(e.target.value)}>
                        <option value="suggestion">💡 Suggestion</option>
                        <option value="bug">🐛 Bug Report</option>
                        <option value="praise">🙌 Praise</option>
                        <option value="other">❓ Other</option>
                    </select>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <label>Your Message</label>
                    <textarea 
                        placeholder="Tell us more..." 
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        required
                        style={{ minHeight: '150px' }}
                    ></textarea>
                </div>

                <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <input 
                        type="checkbox" 
                        id="anon" 
                        checked={anonymous}
                        onChange={(e) => setAnonymous(e.target.checked)}
                        style={{ width: 'auto', marginBottom: 0 }}
                    />
                    <label htmlFor="anon" style={{ marginBottom: 0, fontWeight: 'normal' }}>Submit Anonymously</label>
                </div>

                <button 
                    type="submit" 
                    className="btn-saffron" 
                    disabled={loading}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: '1rem' }}
                >
                    <Send size={20} /> {loading ? 'Sending...' : 'Send Feedback'}
                </button>
            </form>
        </div>
    );
};

export default FeedbackPage;
