import { useState } from 'react';
import { Link } from 'react-router-dom';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { Eye, EyeOff } from 'lucide-react';

const SignupPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            // Send email verification immediately
            await sendEmailVerification(user);
            
            // Update auth profile with name
            await updateProfile(user, { displayName: name });
            
            // Store user in Firestore
            await setDoc(doc(db, "users", user.uid), {
                id: user.uid,
                name: name,
                email: email,
                points: 0,
                role: 'user'
            });

            // Trigger backend registration (for email/logging)
            try {
                await fetch('http://localhost:5000/api/auth/signup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: user.uid, name, email })
                });
            } catch (err) {
                console.warn('Backend sync delayed:', err);
            }
            
            setSuccess(true);
            // Don't navigate automatically, wait for user to see the verification message
        } catch (err: any) {
            console.error('Signup error:', err);
            // Generic security error message
            if (err.code === 'auth/email-already-in-use') {
                setError('Registration successful. If you already had an account, please check your email.');
                setSuccess(true);
            } else {
                setError('Failed to create account. Please ensure your password is secure and try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div style={{ maxWidth: '450px', margin: '4rem auto', textAlign: 'center' }}>
                <div className="card" style={{ padding: '3rem' }}>
                    <div className="success-checkmark">
                        <div className="check-icon">
                            <span className="icon-line line-tip"></span>
                            <span className="icon-line line-long"></span>
                            <div className="icon-circle"></div>
                            <div className="icon-fix"></div>
                        </div>
                    </div>
                    <h2 style={{ color: 'var(--primary-green)', marginTop: '1rem' }}>Welcome to CleanTown! 🎉</h2>
                    <p style={{ color: '#6B7280', marginTop: '0.5rem' }}>Your account initialization has started.</p>
                    <p style={{ color: '#138808', fontWeight: 'bold', marginTop: '1rem' }}>📧 A verification link has been sent to {email}</p>
                    <p style={{ color: '#9CA3AF', fontSize: '0.9rem', marginTop: '0.5rem' }}>Please verify your email to unlock all features, then <Link to="/login" style={{ color: 'var(--primary-saffron)' }}>log in here</Link>.</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '400px', margin: '4rem auto' }}>
            <h1 className="page-title" style={{ textAlign: 'center' }}>Join CleanTown</h1>
            <div className="card">
                <form onSubmit={handleSignup}>
                    {error && <div style={{ color: 'var(--danger-red)', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}
                    
                    <label>Full Name</label>
                    <input 
                        type="text" 
                        placeholder="John Doe" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required 
                    />

                    <label>Email Address</label>
                    <input 
                        type="email" 
                        placeholder="email@example.com" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required 
                    />

                    <label>Password</label>
                    <div style={{ position: 'relative' }}>
                        <input 
                            type={showPassword ? "text" : "password"} 
                            placeholder="Min. 6 characters" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required 
                            minLength={6}
                            style={{ width: '100%', paddingRight: '2.5rem' }}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            style={{
                                position: 'absolute',
                                right: '0.75rem',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: '#6B7280',
                                display: 'flex',
                                alignItems: 'center'
                            }}
                        >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>

                    <button 
                        type="submit" 
                        className="btn-saffron" 
                        style={{ width: '100%', marginTop: '1rem' }}
                        disabled={loading}
                    >
                        {loading ? 'Creating Account...' : 'Get Started'}
                    </button>
                    
                    <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>
                        Already have an account? <Link to="/login" style={{ color: 'var(--primary-green)', fontWeight: 'bold' }}>Login</Link>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default SignupPage;
