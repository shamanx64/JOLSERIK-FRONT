import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

interface LoginScreenProps {
  onLogin: (payload: { email: string; password: string }) => void | Promise<void>;
  onNavigateToRegister: () => void;
}

function readErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error && typeof (error as { message?: unknown }).message === "string") {
    return (error as { message: string }).message;
  }

  return "Unable to sign in right now.";
}

export default function LoginScreen({ onLogin, onNavigateToRegister }: LoginScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    const trimmedEmail = email.trim();
    let hasError = false;

    setEmailError("");
    setPasswordError("");
    setSubmitError("");

    if (!trimmedEmail) {
      setEmailError("Email is required.");
      hasError = true;
    }

    if (!password) {
      setPasswordError("Password is required.");
      hasError = true;
    }

    if (hasError) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onLogin({ email: trimmedEmail, password });
    } catch (error) {
      setSubmitError(readErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Sign In</Text>
          <Text style={styles.subtitle}>Use your backend account to continue.</Text>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="m@example.com"
                placeholderTextColor="#7c8f88"
                value={email}
                onChangeText={(value) => {
                  setEmail(value);
                  setEmailError("");
                  setSubmitError("");
                }}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor="#7c8f88"
                value={password}
                onChangeText={(value) => {
                  setPassword(value);
                  setPasswordError("");
                  setSubmitError("");
                }}
                secureTextEntry
              />
              {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
            </View>

            {submitError ? <Text style={styles.errorText}>{submitError}</Text> : null}

            <Pressable
              style={[styles.primaryButton, isSubmitting && styles.primaryButtonDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              <Text style={styles.primaryButtonText}>{isSubmitting ? "Signing in..." : "Sign In"}</Text>
            </Pressable>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Need an account? </Text>
            <Pressable onPress={onNavigateToRegister}>
              <Text style={styles.linkText}>Register</Text>
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
    backgroundColor: "#d9e6e1",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#173f35",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#11201c",
    marginBottom: 6,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#5a746b",
    marginBottom: 32,
    textAlign: "center",
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#28473e",
    marginLeft: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d4e0db",
    borderRadius: 16,
    backgroundColor: "#f8fcfa",
    color: "#11201c",
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  errorText: {
    color: "#b42318",
    fontSize: 13,
    lineHeight: 18,
  },
  primaryButton: {
    marginTop: 8,
    borderRadius: 16,
    backgroundColor: "#163f35",
    alignItems: "center",
    paddingVertical: 16,
  },
  primaryButtonDisabled: {
    opacity: 0.65,
  },
  primaryButtonText: {
    color: "#f7fcfa",
    fontSize: 16,
    fontWeight: "700",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  footerText: {
    color: "#5a746b",
    fontSize: 14,
  },
  linkText: {
    color: "#163f35",
    fontSize: 14,
    fontWeight: "700",
  },
});
