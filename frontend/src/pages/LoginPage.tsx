import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Eye, EyeOff, ShieldCheck, AlertCircle } from 'lucide-react';
import api from '../api';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [mfaRequired, setMfaRequired] = useState(false);
    const [mfaCode, setMfaCode] = useState('');
    const [captchaToken, setCaptchaToken] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Simple CAPTCHA simulation
        if (!captchaToken) {
            setError('Please verify that you are a human.');
            return;
        }

        setLoading(true);
        setError('');
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const idToken = await userCredential.user.getIdToken();
            
            // Exchange ID Token for Session Cookie
            const response = await api.post('/auth/login', { idToken, mfaCode: mfaRequired ? mfaCode : undefined });
            
            if (response.data.mfaRequired) {
                setMfaRequired(true);
                return;
            }

            navigate('/dashboard');
        } catch (err: any) {
            console.error('Login error:', err);
            setError('Invalid email or password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (!email) {
            setError('Please enter your email first');
            return;
        }
        try {
            // Also notify backend to log this or use our generic reset flow
            await api.post('/auth/reset-password', { email });
            alert('If an account exists, a reset link has been sent to your email.');
        } catch (err) {
            alert('If an account exists, a reset link has been sent to your email.');
        }
    };

    return (
        <div style={{ maxWidth: '400px', margin: '4rem auto' }}>
            <h1 className="page-title" style={{ textAlign: 'center' }}>Welcome Back</h1>
            <div className="card saffron">
                <form onSubmit={handleLogin}>
                    {error && <div style={{ background: '#FEE2E2', color: 'var(--danger-red)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.5rem', textAlign: 'center', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <AlertCircle size={18} /> {error}
                    </div>}
                    
                    {!mfaRequired ? (
                        <>
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

                            <div style={{ margin: '1rem 0', padding: '0.75rem', background: '#F9FAFB', borderRadius: '8px', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <input 
                                    type="checkbox" 
                                    id="captcha" 
                                    onChange={(e) => setCaptchaToken(e.target.checked ? 'mock-token' : null)}
                                    style={{ width: '18px', height: '18px' }}
                                />
                                <label htmlFor="captcha" style={{ margin: 0, fontSize: '0.9rem', cursor: 'pointer' }}>I am not a robot</label>
                                <img src="https://www.gstatic.com/recaptcha/api2/logo_48.png" width="20" alt="reCAPTCHA" style={{ marginLeft: 'auto' }} />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                                <button 
                                    type="button" 
                                    onClick={handleResetPassword}
                                    style={{ background: 'none', border: 'none', color: 'var(--primary-saffron)', cursor: 'pointer', fontSize: '0.85rem' }}
                                >
                                    Forgot Password?
                                </button>
                            </div>
                        </>
                    ) : (
                        <div style={{ animation: 'fadeIn 0.5s ease' }}>
                            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                                <ShieldCheck size={48} color="var(--primary-green)" style={{ margin: '0 auto 1rem' }} />
                                <h3 style={{ margin: 0 }}>Two-Factor Authentication</h3>
                                <p style={{ color: '#6B7280', fontSize: '0.9rem', marginTop: '0.5rem' }}>Enter the 6-digit code from your authenticator app</p>
                            </div>
                            <label>Verification Code</label>
                            <input 
                                type="text" 
                                placeholder="000000" 
                                value={mfaCode}
                                onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                required 
                                style={{ textAlign: 'center', letterSpacing: '8px', fontSize: '1.5rem' }}
                            />
                            <button 
                                type="button" 
                                onClick={() => setMfaRequired(false)}
                                style={{ width: '100%', background: 'none', border: 'none', color: '#6B7280', marginTop: '1rem', cursor: 'pointer', fontSize: '0.9rem' }}
                            >
                                ← Back to Login
                            </button>
                        </div>
                    )}

                    <button 
                        type="submit" 
                        className="btn-green" 
                        style={{ width: '100%', marginTop: '1.5rem' }}
                        disabled={loading}
                    >
                        {loading ? 'Authenticating...' : mfaRequired ? 'Verify & Login' : 'Login Securely'}
                    </button>
                    
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '1rem', color: '#6B7280', fontSize: '0.8rem' }}>
                        <ShieldCheck size={14} /> Multi-factor authentication ready
                    </div>

                    <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>
                        Don't have an account? <Link to="/signup" style={{ color: 'var(--primary-saffron)', fontWeight: 'bold' }}>Sign up</Link>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;
