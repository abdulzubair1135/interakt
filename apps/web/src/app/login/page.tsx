"use client";

import Link from 'next/link';
import { Mail, Lock, ArrowRight, Loader2, X, ShieldAlert, Key } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Forgot password states
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1 = request, 2 = verify & reset
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await axios.post('http://localhost:5005/api/auth/login', {
        identifier: identifier.trim(),
        password
      });
      
      localStorage.setItem('campushub_token', res.data.token);
      router.push('/');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.response?.data?.error || 'Failed to login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');
    setForgotLoading(true);

    try {
      const res = await axios.post('http://localhost:5005/api/auth/forgot-password', {
        identifier: forgotIdentifier.trim()
      });
      setForgotSuccess(res.data.message);
      setForgotStep(2); // Move to OTP entry step
    } catch (err: any) {
      setForgotError(err.response?.data?.error || 'Failed to submit reset request.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleVerifyAndReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');
    setForgotLoading(true);

    try {
      const res = await axios.post('http://localhost:5005/api/auth/verify-reset-otp', {
        identifier: forgotIdentifier.trim(),
        otp: forgotOtp.trim(),
        newPassword: forgotNewPassword
      });
      setForgotSuccess(res.data.message);
      // Clean states and close modal after 2.5 seconds
      setTimeout(() => {
        setShowForgotModal(false);
        setForgotStep(1);
        setForgotIdentifier('');
        setForgotOtp('');
        setForgotNewPassword('');
        setForgotSuccess('');
      }, 2500);
    } catch (err: any) {
      setForgotError(err.response?.data?.error || 'Invalid or expired OTP code.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--accent-purple)] rounded-full mix-blend-multiply filter blur-[128px] opacity-50 animate-blob"></div>
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-[var(--accent-pink)] rounded-full mix-blend-multiply filter blur-[128px] opacity-50 animate-blob animation-delay-2000"></div>
      
      <div className="glass max-w-md w-full p-8 rounded-3xl relative z-10 border border-white/20">
        <div className="text-center mb-10">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-[var(--accent-purple)] to-[var(--accent-pink)] p-[2px] mb-3 shadow-[0_0_20px_rgba(139,92,246,0.3)] overflow-hidden">
            <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover rounded-xl" />
          </div>
          <h1 className="text-4xl font-bold text-gradient mb-1 tracking-tight">Interakt</h1>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">by project x²</p>
          <p className="text-gray-400 text-sm">Sign in to continue to your network</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Email, Phone, or College UID"
                className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--accent-purple)] transition-all"
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--accent-purple)] transition-all"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input 
                type="checkbox" 
                defaultChecked={true}
                className="rounded border-white/10 bg-white/5 text-[var(--accent-purple)] focus:ring-[var(--accent-purple)] w-4 h-4" 
              />
              <span className="text-gray-400">Remember me</span>
            </label>
            <button 
              type="button"
              onClick={() => {
                setShowForgotModal(true);
                setForgotStep(1);
                setForgotError('');
                setForgotSuccess('');
              }}
              className="text-[var(--accent-purple)] hover:text-purple-400 transition-colors focus:outline-none"
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-gradient-to-r from-[var(--accent-purple)] to-[var(--accent-pink)] text-white font-bold rounded-xl flex items-center justify-center space-x-2 hover:shadow-[0_0_20px_rgba(217,70,239,0.4)] hover:scale-[1.02] transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-gray-400">
          Don't have an account?{' '}
          <Link href="/register" className="text-[var(--accent-pink)] hover:text-pink-400 font-bold transition-colors">
            Create an account
          </Link>
        </p>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="glass max-w-md w-full p-6 rounded-3xl border border-white/20 relative shadow-2xl">
            <button 
              onClick={() => setShowForgotModal(false)}
              className="absolute top-4 right-4 p-1 hover:bg-white/5 rounded-full transition-colors text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center mx-auto mb-3">
                <Key className="w-6 h-6 text-purple-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Reset Password</h2>
              <p className="text-xs text-gray-400 mt-1">Request an OTP and reset your credentials</p>
            </div>

            {forgotError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs text-center">
                {forgotError}
              </div>
            )}

            {forgotSuccess && (
              <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-xs text-center">
                {forgotSuccess}
              </div>
            )}

            {forgotStep === 1 ? (
              <form onSubmit={handleForgotRequest} className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">Identifier</label>
                  <input
                    type="text"
                    required
                    value={forgotIdentifier}
                    onChange={(e) => setForgotIdentifier(e.target.value)}
                    placeholder="Email, Phone, or College UID"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl text-sm flex items-center justify-center"
                >
                  {forgotLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Request Reset OTP'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyAndReset} className="space-y-4">
                <div className="p-3 bg-purple-500/5 rounded-xl border border-purple-500/15 mb-2">
                  <p className="text-xs text-purple-300 text-center font-medium">
                    ⚠️ OTP requested! Please ask the Admin for the 6-digit reset code, then enter it below.
                  </p>
                </div>
                
                <div>
                  <label className="block text-xs text-gray-400 font-bold uppercase tracking-wider mb-1.5">6-Digit OTP</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value)}
                    placeholder="123456"
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 text-sm font-mono text-center tracking-[0.3em] focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-400 font-bold uppercase tracking-wider mb-1.5">New Password</label>
                  <input
                    type="password"
                    required
                    value={forgotNewPassword}
                    onChange={(e) => setForgotNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl text-sm flex items-center justify-center"
                >
                  {forgotLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Reset Password'}
                </button>

                <button
                  type="button"
                  onClick={() => setForgotStep(1)}
                  className="w-full text-center text-xs text-purple-400 hover:text-purple-300 font-medium"
                >
                  ← Request code again
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
