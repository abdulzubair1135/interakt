import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Dimensions, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { LogIn, ShieldCheck, Key, ArrowLeft } from 'lucide-react-native';
import { Theme } from '../theme/Theme';

const { width, height } = Dimensions.get('window');

export default function LoginScreen({ navigation }: any) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  // Forgot password flow states
  const [mode, setMode] = useState<'login' | 'forgot_request' | 'forgot_verify'>('login');
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');

  const handleLogin = async () => {
    if (!identifier || !password) return setError('Please fill in all fields');
    
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/login', { identifier: identifier.trim(), password });
      await login(res.data.token, res.data.user);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotRequest = async () => {
    if (!forgotIdentifier) return setError('Please enter your email, UID, or phone');
    setLoading(true);
    setError('');
    setForgotSuccess('');
    try {
      const res = await api.post('/auth/forgot-password', { identifier: forgotIdentifier.trim() });
      setForgotSuccess(res.data.message);
      setMode('forgot_verify');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit reset request.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyReset = async () => {
    if (!forgotOtp || !forgotNewPassword) return setError('Please enter both OTP and new password');
    setLoading(true);
    setError('');
    setForgotSuccess('');
    try {
      const res = await api.post('/auth/verify-reset-otp', {
        identifier: forgotIdentifier.trim(),
        otp: forgotOtp.trim(),
        newPassword: forgotNewPassword
      });
      setForgotSuccess(res.data.message);
      setTimeout(() => {
        setMode('login');
        setForgotIdentifier('');
        setForgotOtp('');
        setForgotNewPassword('');
        setForgotSuccess('');
        setError('');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid or expired OTP code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={Theme.gradients.dark} style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <View style={styles.headerContainer}>
          <View style={styles.logoCircle}>
            <Image 
              source={require('../../assets/logo.jpg')}
              style={{ width: '100%', height: '100%', borderRadius: 48 }}
              resizeMode="cover"
            />
          </View>
          <Text style={styles.title}>Interakt</Text>
          <Text style={styles.subtitle}>by project x²</Text>
        </View>

        <View style={styles.glassCard}>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {forgotSuccess ? <Text style={styles.successText}>{forgotSuccess}</Text> : null}

          {mode === 'login' && (
            <>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Email, UID, or Phone"
                  placeholderTextColor={Theme.colors.textMuted}
                  value={identifier}
                  onChangeText={setIdentifier}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor={Theme.colors.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>

              <TouchableOpacity 
                style={styles.forgotLink} 
                onPress={() => {
                  setMode('forgot_request');
                  setError('');
                  setForgotSuccess('');
                }}
              >
                <Text style={styles.forgotLinkText}>Forgot Password?</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.8}
              >
                <LinearGradient 
                  colors={Theme.gradients.primary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.button}
                >
                  {loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <View style={styles.buttonContent}>
                      <LogIn color="white" size={22} />
                      <Text style={styles.buttonText}>SIGN IN</Text>
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.secondaryButton}
                onPress={() => navigation.navigate('Register')}
              >
                <Text style={styles.secondaryButtonText}>
                  New member? <Text style={{ color: Theme.colors.secondary }}>Create Account</Text>
                </Text>
              </TouchableOpacity>
            </>
          )}

          {mode === 'forgot_request' && (
            <>
              <Text style={styles.sectionTitle}>Reset Password</Text>
              <Text style={styles.sectionSubtitle}>Enter your account details to request a reset OTP</Text>

              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Email, UID, or Phone"
                  placeholderTextColor={Theme.colors.textMuted}
                  value={forgotIdentifier}
                  onChangeText={setForgotIdentifier}
                  autoCapitalize="none"
                />
              </View>

              <TouchableOpacity 
                onPress={handleForgotRequest}
                disabled={loading}
                activeOpacity={0.8}
              >
                <LinearGradient 
                  colors={Theme.gradients.primary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.button}
                >
                  {loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <View style={styles.buttonContent}>
                      <Key color="white" size={20} />
                      <Text style={styles.buttonText}>REQUEST OTP</Text>
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => {
                  setMode('login');
                  setError('');
                  setForgotSuccess('');
                }}
              >
                <View style={styles.backButtonContent}>
                  <ArrowLeft color={Theme.colors.textMuted} size={16} />
                  <Text style={styles.backButtonText}>Back to Login</Text>
                </View>
              </TouchableOpacity>
            </>
          )}

          {mode === 'forgot_verify' && (
            <>
              <View style={styles.alertCard}>
                <Text style={styles.alertText}>
                  ⚠️ OTP requested! Ask the Admin for your 6-digit code.
                </Text>
              </View>

              <View style={styles.inputWrapper}>
                <TextInput
                  style={[styles.input, styles.otpInput]}
                  placeholder="6-Digit OTP"
                  placeholderTextColor={Theme.colors.textMuted}
                  value={forgotOtp}
                  onChangeText={setForgotOtp}
                  keyboardType="number-pad"
                  maxLength={6}
                />
              </View>

              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="New Password"
                  placeholderTextColor={Theme.colors.textMuted}
                  value={forgotNewPassword}
                  onChangeText={setForgotNewPassword}
                  secureTextEntry
                />
              </View>

              <TouchableOpacity 
                onPress={handleVerifyReset}
                disabled={loading}
                activeOpacity={0.8}
              >
                <LinearGradient 
                  colors={Theme.gradients.primary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.button}
                >
                  {loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <View style={styles.buttonContent}>
                      <ShieldCheck color="white" size={22} />
                      <Text style={styles.buttonText}>RESET PASSWORD</Text>
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => {
                  setMode('forgot_request');
                  setError('');
                  setForgotSuccess('');
                }}
              >
                <View style={styles.backButtonContent}>
                  <ArrowLeft color={Theme.colors.textMuted} size={16} />
                  <Text style={styles.backButtonText}>Request OTP Again</Text>
                </View>
              </TouchableOpacity>
            </>
          )}
        </View>

        <Text style={styles.footerText}>Secure • Encrypted • Campus Only</Text>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: Theme.spacing.lg,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  title: {
    fontSize: 40,
    fontWeight: '900',
    color: 'white',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 14,
    color: Theme.colors.textMuted,
    marginTop: 5,
    textTransform: 'uppercase',
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: Theme.borderRadius.xl,
    padding: Theme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  inputWrapper: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: Theme.borderRadius.md,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  input: {
    padding: 18,
    color: 'white',
    fontSize: 16,
  },
  button: {
    borderRadius: Theme.borderRadius.md,
    padding: 18,
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  secondaryButton: {
    marginTop: 25,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: Theme.colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    color: Theme.colors.error,
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 14,
    fontWeight: 'bold',
  },
  footerText: {
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.2)',
    fontSize: 12,
    marginTop: 40,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  successText: {
    color: '#10B981',
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 14,
    fontWeight: 'bold',
  },
  forgotLink: {
    alignSelf: 'flex-end',
    marginBottom: 20,
    marginTop: -5,
  },
  forgotLinkText: {
    color: Theme.colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 5,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: Theme.colors.textMuted,
    textAlign: 'center',
    marginBottom: 20,
  },
  backButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  backButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backButtonText: {
    color: Theme.colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  alertCard: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    marginBottom: 20,
  },
  alertText: {
    color: '#D8B4FE',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
  },
  otpInput: {
    textAlign: 'center',
    fontSize: 20,
    letterSpacing: 8,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});
