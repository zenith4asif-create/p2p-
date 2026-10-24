import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as fbSignOut, 
  sendPasswordResetEmail,
  updateProfile,
  deleteUser,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { 
  getDatabase, 
  ref, 
  set, 
  get, 
  update, 
  remove, 
  onValue, 
  off, 
  serverTimestamp,
  DatabaseReference
} from 'firebase/database';
import { ShareSession, UserProfile } from '../types.ts';

// Official Firebase web configuration hardcoded directly for ShareFlow
export const firebaseConfig = {
  apiKey: "AIzaSyACl9gSrNtkr5O0oLfYQeCIV8OaXbsRrh0",
  authDomain: "thio-82063.firebaseapp.com",
  databaseURL: "https://thio-82063-default-rtdb.firebaseio.com",
  projectId: "thio-82063",
  storageBucket: "thio-82063.firebasestorage.app",
  messagingSenderId: "458356046416",
  appId: "1:458356046416:web:fb5539ac71cb4de875af55",
  measurementId: "G-6YD9BSMSYY"
};

// Initialize Firebase once
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);

// Authentication Helpers
export async function registerUser(name: string, email: string, pass: string): Promise<User> {
  const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
  const user = userCredential.user;
  
  if (name.trim()) {
    await updateProfile(user, { displayName: name.trim() });
  }

  // Record profile in /users/{uid}
  const userRef = ref(db, `users/${user.uid}`);
  await set(userRef, {
    uid: user.uid,
    name: name.trim() || user.email?.split('@')[0] || 'User',
    email: user.email,
    createdAt: Date.now()
  });

  return user;
}

export async function loginUser(email: string, pass: string): Promise<User> {
  const userCredential = await signInWithEmailAndPassword(auth, email, pass);
  return userCredential.user;
}

export async function logoutUser(): Promise<void> {
  await fbSignOut(auth);
}

export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

export async function deleteCurrentUserAccount(): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('No user is currently signed in');
  
  // Clean up user record
  try {
    await remove(ref(db, `users/${user.uid}`));
  } catch (e) {
    console.warn('Could not remove user record from RTDB:', e);
  }
  
  await deleteUser(user);
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const snap = await get(ref(db, `users/${uid}`));
    if (snap.exists()) {
      return snap.val() as UserProfile;
    }
  } catch (e) {
    console.warn('Error fetching user profile:', e);
  }
  return null;
}

// Share Session RTDB Operations
export async function saveShareSession(share: ShareSession): Promise<void> {
  const shareRef = ref(db, `shares/${share.id}`);
  const codeRef = ref(db, `shareCodes/${share.code}`);

  // Save the full share session
  await set(shareRef, share);

  // Save the short code lookup mapping
  await set(codeRef, {
    shareId: share.id,
    ownerUid: share.ownerUid,
    expiresAt: share.expiresAt,
    createdAt: share.createdAt
  });
}

export async function getShareByCode(code: string): Promise<ShareSession | null> {
  const formattedCode = code.trim().toUpperCase();
  const codeSnap = await get(ref(db, `shareCodes/${formattedCode}`));
  
  if (!codeSnap.exists()) {
    return null;
  }

  const { shareId, expiresAt } = codeSnap.val();
  const now = Date.now();
  if (expiresAt && now > expiresAt) {
    return null;
  }

  const shareSnap = await get(ref(db, `shares/${shareId}`));
  if (!shareSnap.exists()) {
    return null;
  }

  const share = shareSnap.val() as ShareSession;
  if (share.expiresAt && now > share.expiresAt) {
    return null;
  }

  return share;
}

export async function getShareById(shareId: string): Promise<ShareSession | null> {
  const shareSnap = await get(ref(db, `shares/${shareId}`));
  if (!shareSnap.exists()) return null;
  return shareSnap.val() as ShareSession;
}

export function subscribeToShare(
  shareId: string, 
  callback: (share: ShareSession | null) => void
): () => void {
  const shareRef = ref(db, `shares/${shareId}`);
  const listener = onValue(shareRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val() as ShareSession);
    } else {
      callback(null);
    }
  }, (err) => {
    console.warn('Share subscription error:', err);
    callback(null);
  });

  return () => off(shareRef, 'value', listener);
}

export async function updateShareStatus(
  shareId: string, 
  updates: Partial<ShareSession>
): Promise<void> {
  const shareRef = ref(db, `shares/${shareId}`);
  await update(shareRef, updates);
}

export async function deleteShareSession(shareId: string, code?: string): Promise<void> {
  try {
    await remove(ref(db, `shares/${shareId}`));
    if (code) {
      await remove(ref(db, `shareCodes/${code}`));
    }
    // Also remove signaling session
    await remove(ref(db, `signaling/${shareId}`));
  } catch (err) {
    console.warn('Error deleting share session:', err);
  }
}

// Signaling RTDB Operations for WebRTC
export function getSignalingRef(sessionId: string): DatabaseReference {
  return ref(db, `signaling/${sessionId}`);
}

export async function cleanExpiredSignaling(sessionId: string): Promise<void> {
  try {
    await remove(ref(db, `signaling/${sessionId}`));
  } catch (e) {
    console.warn('Signaling cleanup notice:', e);
  }
}
