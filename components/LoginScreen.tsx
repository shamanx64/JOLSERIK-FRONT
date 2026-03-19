import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView
} from 'react-native';

interface LoginScreenProps {
  onLogin: () => void;
  onNavigateToRegister: () => void;
}

export default function LoginScreen({ onLogin, onNavigateToRegister }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.card}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Log in to your account</Text>
          
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="m@example.com"
                placeholderTextColor="#7c8f88"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#7c8f88"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <Pressable style={styles.primaryButton} onPress={onLogin}>
              <Text style={styles.primaryButtonText}>Log In</Text>
            </Pressable>
          </View>
          
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <Pressable onPress={onNavigateToRegister}>
              <Text style={styles.linkText}>Sign up</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#d9e6e1',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#173f35',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#11201c',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#5a746b',
    marginBottom: 32,
    textAlign: 'center',
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#28473e',
    marginLeft: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d4e0db',
    borderRadius: 16,
    backgroundColor: '#f8fcfa',
    color: '#11201c',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  primaryButton: {
    marginTop: 8,
    borderRadius: 16,
    backgroundColor: '#163f35',
    alignItems: 'center',
    paddingVertical: 16,
  },
  primaryButtonText: {
    color: '#f7fcfa',
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    color: '#5a746b',
    fontSize: 14,
  },
  linkText: {
    color: '#163f35',
    fontSize: 14,
    fontWeight: '700',
  },
});
