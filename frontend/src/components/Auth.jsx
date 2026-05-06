import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, ShieldCheck, ArrowRight, UserPlus, LogIn, Loader2, Eye, EyeOff, X, User } from 'lucide-react';
import API_BASE_URL from '../config';

const Auth = ({ onLogin, onCancel }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState('input');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  const handleInitialSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    // EXPLICITLY determine endpoint to avoid any state racing
    const targetEndpoint = isLogin ? '/api/v1/auth/login' : '/api/v1/auth/signup';
    const body = isLogin ? { email, password } : { email, password, name };
    
    console.log(`[AUTH] Initiating ${isLogin ? 'LOGIN' : 'SIGNUP'} at ${targetEndpoint}`);
    
    try {
      const response = await fetch(`${API_BASE_URL}${targetEndpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      
      let data = {};
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      }

      if (!response.ok) {
        throw new Error(data.detail || `Server Error (${response.status})`);
      }
      
      if (isLogin) {
        // Direct Login Success
        console.log("[AUTH] Login successful, no OTP needed.");
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('userEmail', data.email);
        localStorage.setItem('userName', data.name);
        onLogin(data);
      } else {
        // Signup triggered OTP
        console.log("[AUTH] Signup initiated, moving to OTP step.");
        setStep('otp');
      }
    } catch (err) {
      console.error("[AUTH] Error:", err.message);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      let data = {};
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      }
      if (!response.ok) throw new Error(data.detail || `Failed to resend OTP (${response.status})`);
      setResendTimer(60);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      // Signup verification
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/verify-signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      let data = {};
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      }
      if (!response.ok) throw new Error(data.detail || `Invalid OTP (${response.status})`);
      
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('userEmail', data.email);
      localStorage.setItem('userName', data.name);
      onLogin(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-primary/80 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md glass rounded-[2rem] border border-white/10 shadow-2xl overflow-hidden relative"
      >
        <button 
          onClick={onCancel}
          className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all z-10"
        >
          <X size={20} />
        </button>

        <div className="p-10">
          <div className="flex justify-center mb-8">
             <div className="w-16 h-16 rounded-2xl bg-accent/20 flex items-center justify-center border border-accent/30 shadow-lg shadow-accent/20">
                <ShieldCheck className="text-accent w-8 h-8" />
             </div>
          </div>

          <h2 className="text-3xl font-black text-white text-center mb-2 tracking-tight">
            {step === 'otp' ? 'Verify OTP' : (isLogin ? 'Welcome Back' : 'Create Account')}
          </h2>
          <p className="text-slate-400 text-center mb-10 text-sm font-medium">
            {step === 'otp' ? `We sent a code to ${email}` : 'Access the Script Intelligence Platform'}
          </p>

          <AnimatePresence mode="wait">
            {step === 'input' ? (
              <motion.form
                key="form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onSubmit={handleInitialSubmit}
                className="space-y-5"
              >
                {!isLogin && (
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-accent transition-colors" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                      placeholder="Full Name"
                    />
                  </div>
                )}

                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-accent transition-colors" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                    placeholder="Email Address"
                  />
                </div>

                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-accent transition-colors" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                    placeholder="Password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {error && (
                  <div className="text-sm text-red-400 text-center bg-red-400/10 py-2 rounded-lg border border-red-400/20">{error}</div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 bg-accent hover:bg-accent-light text-white font-bold rounded-2xl shadow-xl shadow-accent/20 flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
                >
                  {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : (isLogin ? 'Sign In' : 'Sign Up')}
                  {!isLoading && <ArrowRight size={20} />}
                </button>

                <div className="pt-4 text-center">
                  <button
                    type="button"
                    onClick={() => { setIsLogin(!isLogin); setError(''); }}
                    className="text-sm text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-2 mx-auto"
                  >
                    {isLogin ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
                    {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
                  </button>
                </div>
              </motion.form>
            ) : (
              <motion.form
                key="otp"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onSubmit={handleOtpSubmit}
                className="space-y-6"
              >
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl text-white text-center text-4xl font-black py-6 tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-accent/50"
                  placeholder="000000"
                  autoFocus
                />

                {error && (
                  <div className="text-sm text-red-400 text-center">{error}</div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 bg-accent hover:bg-accent-light text-white font-bold rounded-2xl shadow-xl shadow-accent/20 transition-all"
                >
                  {isLoading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : 'Verify Code'}
                </button>

                <div className="flex flex-col gap-3 text-center">
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendTimer > 0}
                    className={`text-sm ${resendTimer > 0 ? 'text-slate-600' : 'text-accent hover:text-accent-light'} font-bold`}
                  >
                    {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend OTP"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep('input')}
                    className="text-xs text-slate-500 uppercase tracking-widest font-bold hover:text-white transition-colors"
                  >
                    ← Back to Login
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
        <div className="bg-white/[0.02] py-4 text-center border-t border-white/5">
           <p className="text-[10px] text-slate-600 font-bold uppercase tracking-[0.2em]">ScriptOps Security Layer</p>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
