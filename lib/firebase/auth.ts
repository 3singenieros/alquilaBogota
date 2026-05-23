"use client";

import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { getFirebaseApp } from "@/lib/firebase/client";
import { getAuth } from "firebase/auth";

export function getFirebaseAuth() {
  return getAuth(getFirebaseApp());
}

export function subscribeAuthState(
  callback: (user: User | null) => void
): () => void {
  return onAuthStateChanged(getFirebaseAuth(), callback);
}

export async function loginWithGoogle() {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(getFirebaseAuth(), provider);
}

export async function loginWithEmailPassword(email: string, password: string) {
  return signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
}

export async function registerWithEmailPassword(email: string, password: string) {
  return createUserWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
}

export async function logoutFirebase() {
  return signOut(getFirebaseAuth());
}

export type { User as FirebaseUser };
