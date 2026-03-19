import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

interface RegisterScreenProps {
  onRegister: (payload: { full_name: string; email: string; password: string }) => void | Promise<void>;
  onNavigateToLogin: () => void;
}

function readErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error && typeof (error as { message?: unknown }).message === "string") {
    return (error as { message: string }).message;
  }

  return "Unable to create your account right now.";
}

function validatePassword(value: string) {
  if (value.length < 8) {
    return "Password must be at least 8 characters.";
  }

  if (!/[A-Z]/.test(value)) {
    return "Password must include at least one uppercase letter.";
  }

  if (!/[0-9]/.test(value)) {
    return "Password must include at least one digit.";
  }

  return "";
}

export default function RegisterScreen({ onRegister, onNavigateToLogin }: RegisterScreenProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullNameError, setFullNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    const trimmedFullName = fullName.trim();
    const trimmedEmail = email.trim();
    const nextPasswordError = validatePassword(password);
    let hasError = false;

    setFullNameError("");
    setEmailError("");
    setPasswordError("");
    setSubmitError("");

    if (!trimmedFullName) {
      setFullNameError("Full name is required.");
      hasError = true;
    }

    if (!trimmedEmail) {
      setEmailError("Email is required.");
      hasError = true;
    }

    if (nextPasswordError) {
      setPasswordError(nextPasswordError);
      hasError = true;
    }

    if (hasError) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onRegister({ full_name: trimmedFullName, email: trimmedEmail, password });
    } catch (error) {
      setSubmitError(readErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Register with the live backend contract.</Text>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Jane Doe"
                  placeholderTextColor="#7c8f88"
                  value={fullName}
                  onChangeText={(value) => {
                    setFullName(value);
                    setFullNameError("");
                    setSubmitError("");
                  }}
                  autoCapitalize="words"
                />
                {fullNameError ? <Text style={styles.errorText}>{fullNameError}</Text> : null}
              </View>

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
                  placeholder="Use 8+ chars, one uppercase, one digit"
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
                <Text style={styles.primaryButtonText}>{isSubmitting ? "Creating account..." : "Register"}</Text>
              </Pressable>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <Pressable onPress={onNavigateToLogin}>
                <Text style={styles.linkText}>Sign In</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
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
  },
  scrollContent: {
    flexGrow: 1,
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
