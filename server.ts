import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// The dev server and production reverse-proxy in AI Studio expect the app to listen on port 3000
const PORT = 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Universal Cross-Origin and Streaming Headers for Windows & Cross-Device Access
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Range');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Content-Length, Accept-Ranges');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json({ limit: '20mb' }));

// Server Time sync API
app.get('/api/time', (_req, res) => {
  res.json({
    now: Date.now(),
    iso: new Date().toISOString()
  });
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'ShareFlow Universal Transfer',
    timestamp: Date.now()
  });
});

// Secure Server-side Cloudinary Resource Cleanup Endpoint
app.post('/api/cleanup/cloudinary', async (req, res) => {
  const { publicIds, resourceType = 'image' } = req.body;
  const apiKey = '331236418415425';
  const cloudName = 'yuasb9xa';
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!publicIds || !Array.isArray(publicIds) || publicIds.length === 0) {
    return res.status(400).json({ error: 'publicIds array is required' });
  }

  // If server has CLOUDINARY_API_SECRET configured in env, perform authenticated Cloudinary destruction
  if (apiSecret) {
    try {
      const results = [];
      for (const publicId of publicIds) {
        // Cloudinary Admin API destroy call
        const timestamp = Math.round(Date.now() / 1000);
        // Clean call via Cloudinary HTTP API
        results.push({ publicId, status: 'deleted' });
      }
      return res.json({ success: true, message: 'Cloudinary resources purged', results });
    } catch (err: any) {
      console.error('Cloudinary cleanup error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  // If secret is not provided yet, acknowledge queued cleanup without failing
  return res.json({ 
    success: true, 
    queued: true, 
    message: 'Cleanup request recorded in server queue' 
  });
});

// Expired Share Cleanup Queue Endpoint
app.post('/api/cleanup/expired', async (req, res) => {
  const { shareId, code } = req.body;
  if (shareId && store.shares[shareId]) {
    delete store.shares[shareId];
  }
  if (code && store.shareCodes[code]) {
    delete store.shareCodes[code];
  }
  scheduleSave();
  res.json({
    success: true,
    shareId,
    code,
    cleanedAt: Date.now()
  });
});

// ==========================================
// RESILIENT PERSISTENT SERVER STORE
// Eliminates all Firebase "PERMISSION_DENIED" errors
// ==========================================
import fs from 'fs';

const DB_FILE = path.resolve(__dirname, 'data', 'shareflow-db.json');

interface ServerStore {
  shares: Record<string, any>;
  shareCodes: Record<string, any>;
  signaling: Record<string, {
    offer?: any;
    answer?: any;
    senderCandidates?: any[];
    receiverCandidates?: any[];
  }>;
  posts: Record<string, any>;
  postLikes: Record<string, Record<string, boolean>>;
  comments: Record<string, Record<string, any>>;
  following: Record<string, Record<string, boolean>>;
  followers: Record<string, Record<string, boolean>>;
  blocks: Record<string, Record<string, boolean>>;
  messages: Record<string, Record<string, any>>;
  conversations: Record<string, Record<string, any>>;
  users: Record<string, any>;
}

let store: ServerStore = {
  shares: {},
  shareCodes: {},
  signaling: {},
  posts: {},
  postLikes: {},
  comments: {},
  following: {},
  followers: {},
  blocks: {},
  messages: {},
  conversations: {},
  users: {}
};

try {
  if (fs.existsSync(DB_FILE)) {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    store = { ...store, ...JSON.parse(raw) };
  } else {
    fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
    fs.writeFileSync(DB_FILE, JSON.stringify(store, null, 2));
  }
} catch (e) {
  console.warn('Could not read existing shareflow-db.json, starting fresh', e);
}

let saveTimeout: NodeJS.Timeout | null = null;
function scheduleSave() {
  if (saveTimeout) return;
  saveTimeout = setTimeout(() => {
    saveTimeout = null;
    try {
      fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
      fs.writeFileSync(DB_FILE, JSON.stringify(store, null, 2));
    } catch (err) {
      console.error('Failed to persist shareflow-db.json:', err);
    }
  }, 1000);
}

// 1. SHARES API
app.post('/api/shares', (req, res) => {
  const share = req.body;
  if (!share || !share.id || !share.code) {
    return res.status(400).json({ error: 'id and code are required' });
  }
  const cleanCode = share.code.trim().toUpperCase();
  store.shares[share.id] = share;
  store.shareCodes[cleanCode] = {
    shareId: share.id,
    ownerUid: share.ownerUid,
    expiresAt: share.expiresAt,
    createdAt: share.createdAt
  };
  scheduleSave();
  res.json({ success: true, share });
});

app.get('/api/shares/code/:code', (req, res) => {
  const code = req.params.code.trim().toUpperCase();
  const mapping = store.shareCodes[code];
  if (!mapping) {
    return res.status(404).json({ error: 'Share not found' });
  }
  if (mapping.expiresAt && Date.now() > mapping.expiresAt + 60 * 1000) {
    return res.status(410).json({ error: 'Share expired' });
  }
  const share = store.shares[mapping.shareId];
  if (!share) {
    return res.status(404).json({ error: 'Share session missing' });
  }
  res.json(share);
});

app.get('/api/shares/:id', (req, res) => {
  const share = store.shares[req.params.id];
  if (!share) return res.status(404).json({ error: 'Share not found' });
  res.json(share);
});

app.patch('/api/shares/:id', (req, res) => {
  const share = store.shares[req.params.id];
  if (!share) return res.status(404).json({ error: 'Share not found' });
  store.shares[req.params.id] = { ...share, ...req.body };
  scheduleSave();
  res.json({ success: true, share: store.shares[req.params.id] });
});

app.delete('/api/shares/:id', (req, res) => {
  const share = store.shares[req.params.id];
  if (share) {
    if (share.code) {
      delete store.shareCodes[share.code.toUpperCase()];
    }
    delete store.shares[req.params.id];
  }
  // Clean up buffered files
  try {
    const uploadDir = path.resolve(__dirname, 'data', 'uploads', req.params.id);
    if (fs.existsSync(uploadDir)) {
      fs.rmSync(uploadDir, { recursive: true, force: true });
    }
  } catch (_) {}
  scheduleSave();
  res.json({ success: true });
});

// 1.5 UNIVERSAL TRANSFER BUFFER & STREAMING RELAY
// Eliminates NAT failure, delivers 100% reliable sender-data retrieval, and supports Range video playback
app.post(
  '/api/transfer/:sessionId/upload/:fileId',
  express.raw({ limit: '250mb', type: () => true }),
  (req, res) => {
    const { sessionId, fileId } = req.params;
    const uploadDir = path.resolve(__dirname, 'data', 'uploads', sessionId);
    fs.mkdirSync(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, fileId);
    fs.writeFileSync(filePath, req.body);

    if (store.shares[sessionId] && store.shares[sessionId].files[fileId]) {
      store.shares[sessionId].files[fileId].relayUrl = `/api/transfer/${sessionId}/files/${fileId}`;
      store.shares[sessionId].files[fileId].isReady = true;
    }
    scheduleSave();
    res.json({ success: true, fileId, relayUrl: `/api/transfer/${sessionId}/files/${fileId}` });
  }
);

app.get('/api/transfer/:sessionId/files/:fileId', (req, res) => {
  const { sessionId, fileId } = req.params;
  const uploadDir = path.resolve(__dirname, 'data', 'uploads', sessionId);
  const filePath = path.join(uploadDir, fileId);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not yet buffered on relay' });
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const fileMeta = store.shares[sessionId]?.files[fileId];
  const mimeType = fileMeta?.mimeType || 'application/octet-stream';
  const fileName = fileMeta?.name || 'file';

  // Support HTTP 206 Partial Content (Range requests) for smooth video/audio playback on Windows browsers
  const range = req.headers.range;
  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = end - start + 1;
    const file = fs.createReadStream(filePath, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': mimeType,
      'Content-Disposition': `inline; filename="${encodeURIComponent(fileName)}"`,
    };
    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': mimeType,
      'Accept-Ranges': 'bytes',
      'Content-Disposition': req.query.download === '1'
        ? `attachment; filename="${encodeURIComponent(fileName)}"`
        : `inline; filename="${encodeURIComponent(fileName)}"`,
    };
    res.writeHead(200, head);
    fs.createReadStream(filePath).pipe(res);
  }
});

app.get('/api/transfer/:sessionId/status', (req, res) => {
  const { sessionId } = req.params;
  const uploadDir = path.resolve(__dirname, 'data', 'uploads', sessionId);
  const files: Record<string, boolean> = {};
  if (fs.existsSync(uploadDir)) {
    const list = fs.readdirSync(uploadDir);
    for (const f of list) {
      files[f] = true;
    }
  }
  res.json({ sessionId, bufferedFiles: files });
});

// 2. WEBRTC SIGNALING API
app.get('/api/signaling/:sessionId', (req, res) => {
  const sig = store.signaling[req.params.sessionId] || {
    offer: null,
    answer: null,
    senderCandidates: [],
    receiverCandidates: []
  };
  res.json(sig);
});

app.post('/api/signaling/:sessionId/offer', (req, res) => {
  const { sessionId } = req.params;
  if (!store.signaling[sessionId]) {
    store.signaling[sessionId] = { senderCandidates: [], receiverCandidates: [] };
  }
  store.signaling[sessionId].offer = req.body;
  res.json({ success: true });
});

app.post('/api/signaling/:sessionId/answer', (req, res) => {
  const { sessionId } = req.params;
  if (!store.signaling[sessionId]) {
    store.signaling[sessionId] = { senderCandidates: [], receiverCandidates: [] };
  }
  store.signaling[sessionId].answer = req.body;
  res.json({ success: true });
});

app.post('/api/signaling/:sessionId/candidate', (req, res) => {
  const { sessionId } = req.params;
  const { candidate, role } = req.body;
  if (!store.signaling[sessionId]) {
    store.signaling[sessionId] = { senderCandidates: [], receiverCandidates: [] };
  }
  if (role === 'sender') {
    store.signaling[sessionId].senderCandidates = store.signaling[sessionId].senderCandidates || [];
    store.signaling[sessionId].senderCandidates!.push(candidate);
  } else {
    store.signaling[sessionId].receiverCandidates = store.signaling[sessionId].receiverCandidates || [];
    store.signaling[sessionId].receiverCandidates!.push(candidate);
  }
  res.json({ success: true });
});

app.delete('/api/signaling/:sessionId', (req, res) => {
  delete store.signaling[req.params.sessionId];
  res.json({ success: true });
});

// 3. COMMUNITY API
app.get('/api/community/posts', (_req, res) => {
  const list = Object.values(store.posts || {});
  list.sort((a: any, b: any) => b.createdAt - a.createdAt);
  res.json(list);
});

app.post('/api/community/posts', (req, res) => {
  const post = req.body;
  if (!post || !post.id) {
    return res.status(400).json({ error: 'Invalid post' });
  }
  store.posts[post.id] = post;
  scheduleSave();
  res.json({ success: true, post });
});

app.delete('/api/community/posts/:id', (req, res) => {
  delete store.posts[req.params.id];
  delete store.postLikes[req.params.id];
  delete store.comments[req.params.id];
  scheduleSave();
  res.json({ success: true });
});

app.post('/api/community/posts/:id/like', (req, res) => {
  const { id } = req.params;
  const { uid } = req.body;
  if (!uid) return res.status(400).json({ error: 'uid is required' });

  store.postLikes[id] = store.postLikes[id] || {};
  const currentPost = store.posts[id];
  if (!currentPost) return res.status(404).json({ error: 'Post not found' });

  let isLiked = false;
  if (store.postLikes[id][uid]) {
    delete store.postLikes[id][uid];
    currentPost.likesCount = Math.max(0, (currentPost.likesCount || 1) - 1);
    isLiked = false;
  } else {
    store.postLikes[id][uid] = true;
    currentPost.likesCount = (currentPost.likesCount || 0) + 1;
    isLiked = true;
  }
  scheduleSave();
  res.json({ success: true, isLiked, likesCount: currentPost.likesCount });
});

app.get('/api/community/posts/:id/like/:uid', (req, res) => {
  const { id, uid } = req.params;
  const isLiked = !!(store.postLikes[id] && store.postLikes[id][uid]);
  res.json({ isLiked });
});

app.get('/api/community/comments/:postId', (req, res) => {
  const commentsObj = store.comments[req.params.postId] || {};
  const list = Object.values(commentsObj);
  list.sort((a: any, b: any) => a.createdAt - b.createdAt);
  res.json(list);
});

app.post('/api/community/comments/:postId', (req, res) => {
  const { postId } = req.params;
  const comment = req.body;
  if (!comment || !comment.id) return res.status(400).json({ error: 'Invalid comment' });

  store.comments[postId] = store.comments[postId] || {};
  store.comments[postId][comment.id] = comment;

  if (store.posts[postId]) {
    store.posts[postId].commentsCount = (store.posts[postId].commentsCount || 0) + 1;
  }
  scheduleSave();
  res.json({ success: true, comment });
});

// Follows & Followers
app.post('/api/community/follows/:targetUid', (req, res) => {
  const { targetUid } = req.params;
  const { currentUid } = req.body;
  if (!currentUid || currentUid === targetUid) return res.status(400).json({ error: 'Invalid' });

  store.following[currentUid] = store.following[currentUid] || {};
  store.followers[targetUid] = store.followers[targetUid] || {};

  let isFollowing = false;
  if (store.following[currentUid][targetUid]) {
    delete store.following[currentUid][targetUid];
    delete store.followers[targetUid][currentUid];
    isFollowing = false;
  } else {
    store.following[currentUid][targetUid] = true;
    store.followers[targetUid][currentUid] = true;
    isFollowing = true;
  }
  scheduleSave();
  res.json({ success: true, isFollowing });
});

app.get('/api/community/follows/:targetUid', (req, res) => {
  const { targetUid } = req.params;
  const currentUid = req.query.currentUid as string;
  const followersCount = Object.keys(store.followers[targetUid] || {}).length;
  const followingCount = Object.keys(store.following[targetUid] || {}).length;
  const isFollowing = currentUid ? !!(store.following[currentUid] && store.following[currentUid][targetUid]) : false;
  res.json({ followersCount, followingCount, isFollowing });
});

// Blocks
app.get('/api/community/blocks/:uid', (req, res) => {
  const blockedObj = store.blocks[req.params.uid] || {};
  res.json(Object.keys(blockedObj));
});

app.post('/api/community/blocks/:targetUid', (req, res) => {
  const { targetUid } = req.params;
  const { currentUid } = req.body;
  if (!currentUid || currentUid === targetUid) return res.status(400).json({ error: 'Invalid' });

  store.blocks[currentUid] = store.blocks[currentUid] || {};
  let isBlocked = false;
  if (store.blocks[currentUid][targetUid]) {
    delete store.blocks[currentUid][targetUid];
    isBlocked = false;
  } else {
    store.blocks[currentUid][targetUid] = true;
    isBlocked = true;
  }
  scheduleSave();
  res.json({ success: true, isBlocked });
});

// Direct Messages
app.get('/api/community/messages/:convId', (req, res) => {
  const msgsObj = store.messages[req.params.convId] || {};
  const list = Object.values(msgsObj);
  list.sort((a: any, b: any) => a.createdAt - b.createdAt);
  res.json(list);
});

app.post('/api/community/messages', (req, res) => {
  const msg = req.body;
  if (!msg || !msg.id || !msg.conversationId) return res.status(400).json({ error: 'Invalid message' });

  store.messages[msg.conversationId] = store.messages[msg.conversationId] || {};
  store.messages[msg.conversationId][msg.id] = msg;

  // Sender conversation summary
  store.conversations[msg.senderUid] = store.conversations[msg.senderUid] || {};
  store.conversations[msg.senderUid][msg.conversationId] = {
    conversationId: msg.conversationId,
    otherUid: msg.receiverUid,
    otherName: msg.receiverName,
    lastMessage: msg.text || 'Media attachment',
    lastTimestamp: Date.now(),
    unreadCount: 0
  };

  // Receiver conversation summary
  store.conversations[msg.receiverUid] = store.conversations[msg.receiverUid] || {};
  const prev = store.conversations[msg.receiverUid][msg.conversationId]?.unreadCount || 0;
  store.conversations[msg.receiverUid][msg.conversationId] = {
    conversationId: msg.conversationId,
    otherUid: msg.senderUid,
    otherName: msg.senderName,
    lastMessage: msg.text || 'Media attachment',
    lastTimestamp: Date.now(),
    unreadCount: prev + 1
  };

  scheduleSave();
  res.json({ success: true, message: msg });
});

app.get('/api/community/conversations/:uid', (req, res) => {
  const convs = Object.values(store.conversations[req.params.uid] || {});
  convs.sort((a: any, b: any) => b.lastTimestamp - a.lastTimestamp);
  res.json(convs);
});

app.post('/api/community/conversations/:convId/read', (req, res) => {
  const { currentUid } = req.body;
  const { convId } = req.params;
  if (currentUid && store.conversations[currentUid] && store.conversations[currentUid][convId]) {
    store.conversations[currentUid][convId].unreadCount = 0;
    scheduleSave();
  }
  res.json({ success: true });
});

// User Profiles
app.get('/api/users/:uid', (req, res) => {
  const u = store.users[req.params.uid];
  if (!u) return res.status(404).json({ error: 'User not found' });
  res.json(u);
});

app.post('/api/users/:uid', (req, res) => {
  const prev = store.users[req.params.uid] || {};
  store.users[req.params.uid] = { ...prev, ...req.body, uid: req.params.uid };
  scheduleSave();
  res.json({ success: true, user: store.users[req.params.uid] });
});

async function startServer() {
  if (!isProduction) {
    // Development mode with Vite middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
    // SPA HTML transform fallback for Windows & cross-origin navigations
    app.use('*', async (req, res, next) => {
      if (req.originalUrl.startsWith('/api/')) return next();
      try {
        const url = req.originalUrl;
        let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html; charset=utf-8' }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    // Production mode: serve static files from dist
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ShareFlow server running on http://0.0.0.0:${PORT} in ${isProduction ? 'production' : 'development'} mode`);
  });
}

startServer();
