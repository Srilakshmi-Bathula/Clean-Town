// CleanTown Leaderboard - Top citizens by impact
import { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { Trophy, Medal, Award } from 'lucide-react';

const Leaderboard = () => {
    const [topUsers, setTopUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const q = query(collection(db, "users"), orderBy("points", "desc"), limit(10));
                const querySnapshot = await getDocs(q);
                const users = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setTopUsers(users);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchLeaderboard();
    }, []);

    const getRankIcon = (index: number) => {
        if (index === 0) return <Trophy color="#FFD700" size={24} />;
        if (index === 1) return <Medal color="#C0C0C0" size={24} />;
        if (index === 2) return <Award color="#CD7F32" size={24} />;
        return <span style={{ width: '24px', textAlign: 'center', fontWeight: 'bold' }}>{index + 1}</span>;
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h1 className="page-title">Top Impact Makers</h1>
            
            <div className="card" style={{ padding: '1rem' }}>
                {loading ? (
                    <p style={{ textAlign: 'center', padding: '2rem' }}>Loading leaderboard...</p>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--bg-color)' }}>
                                <th style={{ padding: '1rem' }}>Rank</th>
                                <th style={{ padding: '1rem' }}>Citizen</th>
                                <th style={{ padding: '1rem', textAlign: 'right' }}>Points</th>
                            </tr>
                        </thead>
                        <tbody>
                            {topUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={3} style={{ padding: '3rem', textAlign: 'center', color: '#6B7280' }}>
                                        <div style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>🌟 No leaders yet!</div>
                                        Be the first to join the leaderboard by reporting an issue!
                                    </td>
                                </tr>
                            ) : topUsers.map((user, index) => (
                                <tr key={index} style={{ borderBottom: '1px solid var(--bg-color)' }}>
                                    <td style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        {getRankIcon(index)}
                                    </td>
                                    <td style={{ padding: '1rem', fontWeight: 500 }}>{user.name}</td>
                                    <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold', color: 'var(--primary-green)' }}>
                                        {user.points}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
            
            <div style={{ marginTop: '2rem', textAlign: 'center', color: '#6B7280' }}>
                <p>Report more issues and swap items to climb the leaderboard!</p>
            </div>
        </div>
    );
};

export default Leaderboard;
