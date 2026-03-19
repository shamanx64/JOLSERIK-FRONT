import React, { useEffect, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import type { SessionResponse } from "../lib/api/types";

type ProfileScreenProps = {
  full_name: string;
  email: string;
  sessions: SessionResponse[];
  isLoadingSessions: boolean;
  profileError: string | null;
  onSaveProfile: (full_name: string) => void | Promise<void>;
  onBack: () => void;
  onLogout: () => void | Promise<void>;
  onLogoutAll: () => void | Promise<void>;
};

function buildInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "U";
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function formatDate(value: string) {
  const nextDate = new Date(value);

  if (Number.isNaN(nextDate.getTime())) {
    return value;
  }

  return nextDate.toLocaleString();
}

function readErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error && typeof (error as { message?: unknown }).message === "string") {
    return (error as { message: string }).message;
  }

  return "Something went wrong.";
}

export default function ProfileScreen({
  full_name,
  email,
  sessions,
  isLoadingSessions,
  profileError,
  onSaveProfile,
  onBack,
  onLogout,
  onLogoutAll,
}: ProfileScreenProps) {
  const [draftName, setDraftName] = useState(full_name);
  const [nameError, setNameError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isLoggingOutAll, setIsLoggingOutAll] = useState(false);

  useEffect(() => {
    setDraftName(full_name);
  }, [full_name]);

  async function handleSave() {
    const trimmedName = draftName.trim();

    setNameError("");
    setSubmitError("");

    if (!trimmedName) {
      setNameError("Full name is required.");
      return;
    }

    setIsSaving(true);

    try {
      await onSaveProfile(trimmedName);
    } catch (error) {
      setSubmitError(readErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleLogoutPress() {
    setIsLoggingOut(true);

    try {
      await onLogout();
    } finally {
      setIsLoggingOut(false);
    }
  }

  async function handleLogoutAllPress() {
    setIsLoggingOutAll(true);

    try {
      await onLogoutAll();
    } finally {
      setIsLoggingOutAll(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Pressable style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>Back to map</Text>
        </Pressable>

        <View style={styles.card}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{buildInitials(full_name)}</Text>
          </View>

          <Text style={styles.title}>Profile</Text>
          <Text style={styles.name}>{full_name}</Text>
          <Text style={styles.email}>{email}</Text>

          <View style={styles.metaBlock}>
            <Text style={styles.metaLabel}>Status</Text>
            <Text style={styles.metaValue}>Connected to backend session</Text>
          </View>

          <View style={styles.formBlock}>
            <Text style={styles.sectionTitle}>Update full name</Text>
            <TextInput
              style={styles.input}
              value={draftName}
              onChangeText={(value) => {
                setDraftName(value);
                setNameError("");
                setSubmitError("");
              }}
              placeholder="Full name"
              placeholderTextColor="#7c8f88"
            />
            {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
            {submitError ? <Text style={styles.errorText}>{submitError}</Text> : null}

            <Pressable
              style={[styles.primaryButton, isSaving && styles.disabledButton]}
              onPress={handleSave}
              disabled={isSaving}
            >
              <Text style={styles.primaryButtonText}>{isSaving ? "Saving..." : "Save profile"}</Text>
            </Pressable>
          </View>

          <View style={styles.sessionsBlock}>
            <Text style={styles.sectionTitle}>Active sessions</Text>
            {profileError ? <Text style={styles.errorText}>{profileError}</Text> : null}
            {isLoadingSessions ? <Text style={styles.sessionMeta}>Loading sessions...</Text> : null}
            {!isLoadingSessions && sessions.length === 0 ? (
              <Text style={styles.sessionMeta}>No active sessions returned by the backend.</Text>
            ) : null}
            {!isLoadingSessions
              ? sessions.map((session) => (
                  <View key={session.id} style={styles.sessionCard}>
                    <Text style={styles.sessionTitle}>{session.id}</Text>
                    <Text style={styles.sessionMeta}>Created: {formatDate(session.created_at)}</Text>
                    <Text style={styles.sessionMeta}>Last used: {formatDate(session.last_used_at)}</Text>
                    <Text style={styles.sessionMeta}>Expires: {formatDate(session.expires_at)}</Text>
                    <Text style={styles.sessionMeta}>Revoked: {session.is_revoked ? "Yes" : "No"}</Text>
                  </View>
                ))
              : null}
          </View>

          <Pressable style={styles.primaryButton} onPress={onBack}>
            <Text style={styles.primaryButtonText}>Open main map</Text>
          </Pressable>

          <Pressable
            style={[styles.secondaryButton, isLoggingOut && styles.disabledButton]}
            onPress={handleLogoutPress}
            disabled={isLoggingOut}
          >
            <Text style={styles.secondaryButtonText}>{isLoggingOut ? "Signing out..." : "Sign out"}</Text>
          </Pressable>

          <Pressable
            style={[styles.tertiaryButton, isLoggingOutAll && styles.disabledButton]}
            onPress={handleLogoutAllPress}
            disabled={isLoggingOutAll}
          >
            <Text style={styles.tertiaryButtonText}>
              {isLoggingOutAll ? "Signing out everywhere..." : "Logout from all devices"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#d9e6e1",
  },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  backButton: {
    alignSelf: "flex-start",
    marginBottom: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "rgba(255, 255, 255, 0.86)",
  },
  backButtonText: {
    color: "#163f35",
    fontSize: 14,
    fontWeight: "700",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 28,
    padding: 24,
    alignItems: "center",
    shadowColor: "#173f35",
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  avatar: {
    width: 92,
    height: 92,
    borderRadius: 999,
    backgroundColor: "#163f35",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  avatarText: {
    color: "#f7fcfa",
    fontSize: 34,
    fontWeight: "800",
  },
  title: {
    color: "#11201c",
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 10,
  },
  name: {
    color: "#163f35",
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
  },
  email: {
    color: "#5a746b",
    fontSize: 15,
    marginTop: 4,
    marginBottom: 18,
  },
  metaBlock: {
    width: "100%",
    borderRadius: 18,
    backgroundColor: "#eef5f2",
    padding: 16,
    marginBottom: 18,
  },
  metaLabel: {
    color: "#5a746b",
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 6,
  },
  metaValue: {
    color: "#163f35",
    fontSize: 16,
    fontWeight: "700",
  },
  formBlock: {
    width: "100%",
    marginBottom: 18,
  },
  sessionsBlock: {
    width: "100%",
    marginBottom: 18,
  },
  sectionTitle: {
    color: "#163f35",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 10,
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
    marginTop: 8,
  },
  sessionCard: {
    borderWidth: 1,
    borderColor: "#d8e3de",
    backgroundColor: "#f8fcfa",
    borderRadius: 18,
    padding: 14,
    marginTop: 10,
  },
  sessionTitle: {
    color: "#163f35",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 6,
  },
  sessionMeta: {
    color: "#5a746b",
    lineHeight: 19,
  },
  primaryButton: {
    width: "100%",
    borderRadius: 18,
    backgroundColor: "#163f35",
    alignItems: "center",
    paddingVertical: 15,
  },
  disabledButton: {
    opacity: 0.65,
  },
  primaryButtonText: {
    color: "#f7fcfa",
    fontSize: 15,
    fontWeight: "800",
  },
  secondaryButton: {
    width: "100%",
    borderRadius: 18,
    backgroundColor: "#edf3f0",
    alignItems: "center",
    paddingVertical: 15,
    marginTop: 10,
  },
  secondaryButtonText: {
    color: "#163f35",
    fontSize: 15,
    fontWeight: "800",
  },
  tertiaryButton: {
    width: "100%",
    borderRadius: 18,
    backgroundColor: "#fff3f2",
    alignItems: "center",
    paddingVertical: 15,
    marginTop: 10,
  },
  tertiaryButtonText: {
    color: "#b42318",
    fontSize: 15,
    fontWeight: "800",
  },
});
