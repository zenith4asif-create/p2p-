# ShareFlow - Universal Privacy-Focused File Transfer

> **"Share Anything. Scan. Transfer. Done."**

ShareFlow is a privacy-first universal file sharing platform enabling instant file transfers across devices via browser-to-browser WebRTC DataChannels, real-time QR codes, short 6-character access codes, and temporary Cloudinary storage fallback.

---

## Key Features

1. **Direct WebRTC P2P Transfer**:
   - Stream files directly browser-to-browser using binary `RTCDataChannel`.
   - Native backpressure control (`bufferedAmount` / `bufferedAmountLowThreshold`) prevents memory congestion.
   - Sequential multi-file transmission queue with speed calculation (MB/s) and dynamic ETA.
2. **10-Minute Automatic Expiration**:
   - Every share strictly self-destructs after 10 minutes.
   - Verified on client and server (`currentTime < expiresAt`); expired shares are immediately rejected.
3. **Real-time QR Sharing**:
   - Instant crisp QR code generation with 1-click download (`.png`), clipboard copy, and Web Share API.
4. **Integrated QR Camera Scanner**:
   - In-app rear camera detection with targeting reticle, torch toggle, and fallback to manual code entry.
5. **Short 6-Character Codes**:
   - Cryptographically random (`crypto.getRandomValues`) codes avoiding ambiguous characters (`0`, `O`, `1`, `I`, `L`) with automatic RTDB collision checks.
6. **Cloudinary Temporary Storage Fallback**:
   - Automatic fallback to unsigned Cloudinary storage (`ml_default`) if peer-to-peer firewalls/NAT block direct connections.
   - Automatically handles image, video, and raw binaries (PDF, APK, ZIP, code, docs).
7. **Firebase Authentication & Realtime Database**:
   - Modular SDK v10/v11+ implementation for user profiles and ephemeral session signaling.
   - Secure RTDB Security Rules preventing unauthorized writes or expiration tampering.
8. **Installable PWA**:
   - Full Progressive Web App with service worker, web manifest, offline connectivity monitor, and in-app install prompt.

---

## Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons
- **Realtime & Signaling**: Firebase Realtime Database (RTDB), Firebase Authentication
- **Peer-to-Peer Protocol**: WebRTC `RTCPeerConnection`, `RTCDataChannel`
- **Cloud Storage**: Cloudinary (Unsigned upload preset `ml_default`)
- **QR Utilities**: `qrcode`, `jsqr`
- **Backend / Server**: Node.js, Express, Vite middleware

---

## Deployment Guide

### 1. Firebase Setup & Authentication
1. Go to the [Firebase Console](https://console.firebase.google.com/) and select project `thio-82063` (or your custom project).
2. Under **Authentication** -> **Sign-in method**, enable **Email/Password**.

### 2. Realtime Database Creation & Security Rules
1. In the Firebase console, navigate to **Realtime Database**.
2. Select your database region (`https://thio-82063-default-rtdb.firebaseio.com`).
3. Deploy the security rules located in `firebase/database.rules.json`. These rules enforce:
   - User profile isolation (`/users/{uid}`)
   - Immutable share creation timestamps and 10-minute expiry constraints
   - Expired share read/write rejections

### 3. Cloudinary Upload Preset Configuration
1. In your Cloudinary console, verify Cloud Name: `yuasb9xa`.
2. Under **Settings** -> **Upload** -> **Upload presets**, ensure `ml_default` is set to **Unsigned**.
3. Allowed resource types: `image`, `video`, `raw`.

### 4. Environment Variables
Copy `.env.example` to `.env`:
```bash
# Firebase Client Configuration (Safe for browser client)
VITE_FIREBASE_API_KEY="AIzaSyACl9gSrNtkr5O0oLfYQeCIV8OaXbsRrh0"
VITE_FIREBASE_AUTH_DOMAIN="thio-82063.firebaseapp.com"
VITE_FIREBASE_DATABASE_URL="https://thio-82063-default-rtdb.firebaseio.com"
VITE_FIREBASE_PROJECT_ID="thio-82063"
VITE_FIREBASE_STORAGE_BUCKET="thio-82063.firebasestorage.app"
VITE_FIREBASE_MESSAGING_SENDER_ID="458356046416"
VITE_FIREBASE_APP_ID="1:458356046416:web:fb5539ac71cb4de875af55"

# Cloudinary Configuration
VITE_CLOUDINARY_CLOUD_NAME="yuasb9xa"
VITE_CLOUDINARY_UPLOAD_PRESET="ml_default"
VITE_CLOUDINARY_API_KEY="331236418415425"

# Server-Side Only Secret (Optional for authenticated Cloudinary deletion API)
CLOUDINARY_API_SECRET=""
```

### 5. Running & Building
- **Development**:
  ```bash
  npm run dev
  ```
- **Production Build**:
  ```bash
  npm run build
  npm start
  ```

### 6. HTTPS & WebRTC Requirements
- Modern browsers require HTTPS (or `localhost`) to access camera devices (`getUserMedia`) and WebRTC media streams. Always serve behind an SSL certificate in production.
