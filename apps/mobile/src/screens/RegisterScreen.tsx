import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { UserPlus, ArrowLeft, Sparkles } from 'lucide-react-native';
import { Theme } from '../theme/Theme';

export default function RegisterScreen({ navigation }: any) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [uid, setUid] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleRegister = async () => {
    if (!username || !email || !password || !uid || !phone) return setError('Please fill in all fields');
    
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/register', { 
        username, 
        email, 
        password,
        uid: uid.trim(),
        phone: phone.trim()
      });
      await login(res.data.token, res.data.user);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={Theme.gradients.dark} style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft color="white" size={28} />
          </TouchableOpacity>

          <View style={styles.headerContainer}>
            <Sparkles color={Theme.colors.secondary} size={40} />
            <Text style={styles.title}>Interakt</Text>
            <Text style={styles.subtitle}>by project x²</Text>
          </View>

          <View style={styles.glassCard}>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                placeholderTextColor={Theme.colors.textMuted}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="University Email"
                placeholderTextColor={Theme.colors.textMuted}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="College UID (e.g. 24BCA01, 2024004582)"
                placeholderTextColor={Theme.colors.textMuted}
                value={uid}
                onChangeText={setUid}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Phone Number"
                placeholderTextColor={Theme.colors.textMuted}
                value={phone}
                onChangeText={setPhone}
                autoCapitalize="none"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Secure Password"
                placeholderTextColor={Theme.colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity 
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.8}
            >
              <LinearGradient 
                colors={['#d946ef', '#c026d3']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.button}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <View style={styles.buttonContent}>
                    <UserPlus color="white" size={22} />
                    <Text style={styles.buttonText}>CREATE ACCOUNT</Text>
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.secondaryButtonText}>
                Already a member? <Text style={{ color: Theme.colors.primary }}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Theme.spacing.lg,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 60,
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: 'white',
    marginTop: 10,
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
  }
});
