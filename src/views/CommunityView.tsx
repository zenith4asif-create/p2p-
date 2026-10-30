import React, { useState, useEffect, useRef } from 'react';
import { 
  Heart, 
  MessageSquare, 
  Share2, 
  Send, 
  Image as ImageIcon, 
  Video, 
  MoreVertical, 
  UserPlus, 
  UserCheck, 
  ShieldAlert, 
  Trash2, 
  Smile, 
  ArrowLeft, 
  Loader2, 
  Lock, 
  Mail, 
  Users, 
  Sparkles, 
  User, 
  Check, 
  X, 
  Play, 
  Download, 
  Camera,
  MessageCircle,
  Clock,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useToast } from '../context/ToastContext.tsx';
import { RGBLightBox } from '../components/RGBLightBox.tsx';
import { CommunityPost, CommunityComment, DirectMessage, ConversationSummary, UserProfile } from '../types.ts';
import { 
  createCommunityPost, 
  subscribeCommunityPosts, 
  deleteCommunityPost, 
  togglePostLike, 
  subscribePostLikeStatus, 
  addPostComment, 
  subscribePostComments, 
  toggleFollowUser, 
  subscribeIsFollowing, 
  subscribeUserFollowCounts, 
  toggleBlockUser, 
  subscribeBlockedUsers, 
  sendDirectMessage, 
  subscribeDirectMessages, 
  subscribeUserConversations, 
  markConversationAsRead,
  getCommunityUserProfile,
  updateCommunityUserProfile
} from '../services/community.ts';
import { uploadToCloudinary } from '../services/cloudinary.ts';
import { formatBytes } from '../utils/helpers.ts';
import { triggerHaptic } from '../utils/haptics.ts';

interface CommunityViewProps {
  onOpenAuth: () => void;
  onNavigate: (view: string) => void;
}

export const CommunityView: React.FC<CommunityViewProps> = ({ onOpenAuth, onNavigate }) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  // Navigation sub-tabs: 'feed' | 'messages' | 'profile'
  const [activeTab, setActiveTab] = useState<'feed' | 'messages' | 'profile'>('feed');

  // Posts State
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);

  // New Post Form State
  const [newPostContent, setNewPostContent] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<File | null>(null);
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'file' | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [uploadPercent, setUploadPercent] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Comments State
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Blocked Users Set
  const [blockedUids, setBlockedUids] = useState<Set<string>>(new Set());

  // Direct Messaging State
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeChatUser, setActiveChatUser] = useState<{ uid: string; name: string; avatar?: string } | null>(null);
  const [chatMessages, setChatMessages] = useState<DirectMessage[]>([]);
  const [chatInputText, setChatInputText] = useState('');
  const [chatMediaFile, setChatMediaFile] = useState<File | null>(null);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const chatFileInputRef = useRef<HTMLInputElement>(null);

  // User Profile Inspection Modal / View
  const [viewingProfileUid, setViewingProfileUid] = useState<string | null>(null);
  const [viewedProfile, setViewedProfile] = useState<UserProfile | null>(null);
  const [viewedFollowCounts, setViewedFollowCounts] = useState<{ followers: number; following: number }>({ followers: 0, following: 0 });
  const [isFollowingViewed, setIsFollowingViewed] = useState(false);

  // Media Lightbox Modal
  const [activeLightbox, setActiveLightbox] = useState<{ url: string; type: 'video' | 'image'; title?: string } | null>(null);

  // 1. Subscribe to Community Posts
  useEffect(() => {
    setIsLoadingPosts(true);
    const unsubscribe = subscribeCommunityPosts((fetched) => {
      setPosts(fetched);
      setIsLoadingPosts(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Subscribe to Blocked Users
  useEffect(() => {
    if (!user) {
      setBlockedUids(new Set());
      return;
    }
    const unsubscribe = subscribeBlockedUsers(user.uid, (set) => {
      setBlockedUids(set);
    });
    return () => unsubscribe();
  }, [user]);

  // 3. Subscribe to Direct Message Conversations
  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeUserConversations(user.uid, (convList) => {
      setConversations(convList);
    });
    return () => unsubscribe();
  }, [user]);

  // 4. Subscribe to Active Chat Messages
  useEffect(() => {
    if (!user || !activeChatUser) {
      setChatMessages([]);
      return;
    }
    const convId = [user.uid, activeChatUser.uid].sort().join('_');
    markConversationAsRead(user.uid, convId).catch(() => {});

    const unsubscribe = subscribeDirectMessages(user.uid, activeChatUser.uid, (msgs) => {
      setChatMessages(msgs);
      setTimeout(() => {
        chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });

    return () => unsubscribe();
  }, [user, activeChatUser]);

  // 5. Subscribe to Comments on Active Post
  useEffect(() => {
    if (!activeCommentPostId) {
      setComments([]);
      return;
    }
    const unsubscribe = subscribePostComments(activeCommentPostId, (list) => {
      setComments(list);
    });
    return () => unsubscribe();
  }, [activeCommentPostId]);

  // 6. Handle Viewing Another User's Profile
  useEffect(() => {
    if (!viewingProfileUid) {
      setViewedProfile(null);
      return;
    }
    getCommunityUserProfile(viewingProfileUid).then(setViewedProfile);
    const unsubCounts = subscribeUserFollowCounts(viewingProfileUid, setViewedFollowCounts);
    const unsubFollowing = subscribeIsFollowing(user?.uid || null, viewingProfileUid, setIsFollowingViewed);

    return () => {
      unsubCounts();
      unsubFollowing();
    };
  }, [viewingProfileUid, user]);

  // Handle Media Selection for Post
  const handleSelectMedia = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    triggerHaptic('selection');
    setSelectedMedia(file);
    const preview = URL.createObjectURL(file);
    setMediaPreviewUrl(preview);

    if (file.type.startsWith('video/') || /\.(mp4|mov|webm|mkv|m4v)$/i.test(file.name)) {
      setMediaType('video');
    } else if (file.type.startsWith('image/')) {
      setMediaType('image');
    } else {
      setMediaType('file');
    }
  };

  const handleClearSelectedMedia = () => {
    setSelectedMedia(null);
    if (mediaPreviewUrl) {
      URL.revokeObjectURL(mediaPreviewUrl);
    }
    setMediaPreviewUrl(null);
    setMediaType(null);
  };

  // Submit Post
  const handleCreatePost = async () => {
    if (!user) {
      onOpenAuth();
      return;
    }
    if (!newPostContent.trim() && !selectedMedia) {
      showToast('Please write some text or attach media to post', 'info');
      return;
    }

    setIsPosting(true);
    setUploadPercent(0);

    try {
      let uploadedUrl = '';
      if (selectedMedia) {
        showToast('Uploading media to high-speed cloud buffer...', 'info');
        const uploadRes = await uploadToCloudinary(selectedMedia, (percent) => {
          setUploadPercent(percent);
        });
        uploadedUrl = uploadRes.secureUrl;
      }

      await createCommunityPost({
        authorUid: user.uid,
        authorName: user.displayName || user.email?.split('@')[0] || 'Community Pioneer',
        authorAvatar: user.photoURL || '',
        content: newPostContent.trim(),
        mediaUrl: uploadedUrl,
        mediaType: mediaType || undefined,
        mediaName: selectedMedia?.name,
        mediaSize: selectedMedia?.size,
      });

      triggerHaptic('success');
      showToast('Post shared to ShareFlow Community! ✨', 'success');
      setNewPostContent('');
      handleClearSelectedMedia();
    } catch (err) {
      console.error('Failed to create post:', err);
      showToast('Could not publish post. Please retry.', 'error');
    } finally {
      setIsPosting(false);
      setUploadPercent(0);
    }
  };

  // Handle Post Like
  const handleLike = async (postId: string) => {
    if (!user) {
      onOpenAuth();
      return;
    }
    triggerHaptic('tap');
    try {
      await togglePostLike(postId, user.uid);
    } catch (err) {
      console.error('Like error:', err);
    }
  };

  // Handle Post Comment
  const handleAddComment = async (postId: string) => {
    if (!user) {
      onOpenAuth();
      return;
    }
    if (!newCommentText.trim()) return;

    setIsSubmittingComment(true);
    try {
      await addPostComment(
        postId,
        user.uid,
        user.displayName || user.email?.split('@')[0] || 'Member',
        user.photoURL || '',
        newCommentText.trim()
      );
      setNewCommentText('');
      triggerHaptic('tap');
      showToast('Comment posted! 💬', 'success');
    } catch (err) {
      console.error('Comment error:', err);
      showToast('Failed to post comment', 'error');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Handle Follow / Unfollow
  const handleFollowToggle = async (targetUid: string) => {
    if (!user) {
      onOpenAuth();
      return;
    }
    triggerHaptic('selection');
    try {
      const isNowFollowing = await toggleFollowUser(user.uid, targetUid);
      showToast(isNowFollowing ? 'Followed user! 🤝' : 'Unfollowed user', 'info');
    } catch (err) {
      console.error('Follow toggle error:', err);
    }
  };

  // Handle Block / Unblock
  const handleBlockToggle = async (targetUid: string) => {
    if (!user) {
      onOpenAuth();
      return;
    }
    triggerHaptic('selection');
    const isCurrentlyBlocked = blockedUids.has(targetUid);
    const confirm = window.confirm(
      isCurrentlyBlocked 
        ? 'Unblock this user? Their posts and messages will become visible again.' 
        : 'Block this user? You will no longer see their posts or receive messages.'
    );
    if (!confirm) return;

    try {
      const isNowBlocked = await toggleBlockUser(user.uid, targetUid);
      showToast(isNowBlocked ? 'User blocked 🛡️' : 'User unblocked', 'info');
      if (viewingProfileUid === targetUid) {
        setViewingProfileUid(null);
      }
      if (activeChatUser?.uid === targetUid) {
        setActiveChatUser(null);
      }
    } catch (err) {
      console.error('Block toggle error:', err);
    }
  };

  // Handle Delete Post
  const handleDeletePost = async (postId: string) => {
    if (!window.confirm('Delete this post?')) return;
    triggerHaptic('tap');
    try {
      await deleteCommunityPost(postId);
      showToast('Post removed', 'info');
    } catch (err) {
      showToast('Failed to delete post', 'error');
    }
  };

  // Handle Share Post link
  const handleSharePost = async (post: CommunityPost) => {
    triggerHaptic('selection');
    const shareUrl = `${window.location.origin}/#post/${post.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `ShareFlow Community: ${post.authorName}`,
          text: post.content.substring(0, 100),
          url: shareUrl,
        });
        return;
      } catch (_) {}
    }
    navigator.clipboard.writeText(shareUrl);
    showToast('Link copied to clipboard! 📋', 'success');
  };

  // Send Direct Message
  const handleSendMessage = async () => {
    if (!user || !activeChatUser) return;
    if (!chatInputText.trim() && !chatMediaFile) return;

    setIsSendingMessage(true);
    triggerHaptic('tap');

    try {
      let mediaUrl = '';
      let mType: 'image' | 'video' | 'file' | undefined;

      if (chatMediaFile) {
        showToast('Uploading attachment...', 'info');
        const uploadRes = await uploadToCloudinary(chatMediaFile);
        mediaUrl = uploadRes.secureUrl;
        if (chatMediaFile.type.startsWith('video/')) mType = 'video';
        else if (chatMediaFile.type.startsWith('image/')) mType = 'image';
        else mType = 'file';
      }

      await sendDirectMessage({
        senderUid: user.uid,
        senderName: user.displayName || user.email?.split('@')[0] || 'User',
        senderAvatar: user.photoURL || '',
        receiverUid: activeChatUser.uid,
        receiverName: activeChatUser.name,
        receiverAvatar: activeChatUser.avatar,
        text: chatInputText.trim(),
        mediaUrl,
        mediaType: mType,
        mediaName: chatMediaFile?.name,
      });

      setChatInputText('');
      setChatMediaFile(null);
    } catch (err) {
      console.error('Failed to send DM:', err);
      showToast('Failed to send message', 'error');
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Filter posts (omit blocked users)
  const visiblePosts = posts.filter((p) => !blockedUids.has(p.authorUid));

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-6 pb-24 select-none animate-in fade-in">
      
      {/* Community Header & Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-6 border-b border-black/10 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold tracking-widest uppercase px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              Realtime Hub
            </span>
            <span className="text-xs text-slate-500 dark:text-neutral-400 font-mono">
              Zero Server Limits
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
            Community Stream
          </h1>
        </div>

        {/* Sub-Tabs: Feed | Messages | Profile */}
        <div className="flex items-center p-1 rounded-2xl liquid-glass-input shrink-0">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('tap');
              setActiveTab('feed');
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'feed'
                ? 'liquid-glass-accent text-white shadow-md'
                : 'text-slate-600 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Feed</span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic('tap');
              if (!user) {
                onOpenAuth();
                return;
              }
              setActiveTab('messages');
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition relative ${
              activeTab === 'messages'
                ? 'liquid-glass-accent text-white shadow-md'
                : 'text-slate-600 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            <span>Messages</span>
            {conversations.some((c) => (c.unreadCount || 0) > 0) && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic('tap');
              if (!user) {
                onOpenAuth();
                return;
              }
              setViewingProfileUid(user.uid);
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white transition"
          >
            <User className="w-4 h-4" />
            <span>My Profile</span>
          </button>
        </div>
      </div>

      {/* Auth Banner if Guest */}
      {!user && (
        <div className="mb-6 p-4 sm:p-5 rounded-3xl liquid-glass-card border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="w-12 h-12 rounded-2xl liquid-glass-button text-emerald-500 flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <p className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                Connect &amp; Share with the Network
              </p>
              <p className="text-xs text-slate-600 dark:text-neutral-300">
                Create a free account to publish posts, stream 4K videos, follow pioneers, and chat privately.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenAuth}
            className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 rounded-2xl liquid-glass-accent text-white text-xs font-black tracking-wide shadow-md hover:scale-105 active:scale-95 transition"
          >
            Sign In / Register
          </button>
        </div>
      )}

      {/* TAB 1: FEED VIEW */}
      {activeTab === 'feed' && (
        <div className="space-y-6">
          
          {/* Create Post Card (with strict RGB Outline effect) */}
          <RGBLightBox className="w-full shadow-xl" innerClassName="p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl liquid-glass-button text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center shrink-0 text-sm overflow-hidden">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  user?.displayName?.[0]?.toUpperCase() || <User className="w-5 h-5" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <textarea
                  rows={3}
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder={user ? "Share an update, 4K video, picture or tech discovery..." : "Sign in to share with community..."}
                  disabled={!user || isPosting}
                  className="w-full liquid-glass-input rounded-2xl p-3 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none resize-none"
                />

                {/* Selected Media Preview */}
                {selectedMedia && mediaPreviewUrl && (
                  <div className="relative mt-3 rounded-2xl overflow-hidden liquid-glass-input p-2 border border-black/10 dark:border-white/10">
                    <button
                      type="button"
                      onClick={handleClearSelectedMedia}
                      className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black transition shadow-md"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    {mediaType === 'video' ? (
                      <video
                        src={mediaPreviewUrl}
                        controls
                        playsInline
                        className="w-full max-h-64 rounded-xl object-contain bg-black"
                      />
                    ) : mediaType === 'image' ? (
                      <img
                        src={mediaPreviewUrl}
                        alt="Preview"
                        className="w-full max-h-64 rounded-xl object-contain"
                      />
                    ) : (
                      <div className="p-4 text-xs font-mono text-slate-700 dark:text-neutral-300">
                        📎 {selectedMedia.name} ({formatBytes(selectedMedia.size)})
                      </div>
                    )}
                  </div>
                )}

                {/* Cloudinary Upload Progress Indicator */}
                {isPosting && uploadPercent > 0 && (
                  <div className="mt-3 p-3 rounded-xl liquid-glass-input space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">Uploading Media Stream...</span>
                      <span>{uploadPercent}%</span>
                    </div>
                    <div className="w-full bg-black/10 dark:bg-white/10 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-emerald-500 h-full transition-all duration-100" 
                        style={{ width: `${uploadPercent}%` }} 
                      />
                    </div>
                  </div>
                )}

                {/* Actions Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-3 border-t border-black/10 dark:border-white/10">
                  <div className="flex items-center gap-1.5">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,video/*"
                      className="hidden"
                      onChange={handleSelectMedia}
                    />

                    <button
                      type="button"
                      disabled={!user || isPosting}
                      onClick={() => fileInputRef.current?.click()}
                      className="min-h-[38px] px-3 py-1.5 rounded-xl liquid-glass-button text-xs font-semibold text-slate-700 dark:text-neutral-300 flex items-center gap-1.5 hover:text-slate-950 dark:hover:text-white transition disabled:opacity-40"
                    >
                      <ImageIcon className="w-4 h-4 text-emerald-500" />
                      <span>Photo / Video</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleCreatePost}
                    disabled={!user || isPosting || (!newPostContent.trim() && !selectedMedia)}
                    className="min-h-[40px] px-5 py-2 rounded-2xl liquid-glass-accent text-white text-xs font-black flex items-center gap-2 shadow-md active:scale-95 disabled:opacity-40 transition"
                  >
                    {isPosting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Publishing...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>POST STREAM</span>
                      </>
                    )}
                  </button>
                </div>

              </div>
            </div>
          </RGBLightBox>

          {/* Posts Feed List */}
          {isLoadingPosts ? (
            <div className="py-16 text-center">
              <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-500 dark:text-neutral-400 font-mono">Syncing real-time community stream...</p>
            </div>
          ) : visiblePosts.length === 0 ? (
            <div className="py-14 text-center liquid-glass-card rounded-3xl p-6">
              <Users className="w-10 h-10 text-slate-400 dark:text-neutral-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">No Posts Yet</h3>
              <p className="text-xs text-slate-600 dark:text-neutral-300 max-w-sm mx-auto mb-4">
                Be the first to share a post, video or file with the community!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {visiblePosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUserUid={user?.uid || null}
                  onLike={() => handleLike(post.id)}
                  onOpenComments={() => setActiveCommentPostId(activeCommentPostId === post.id ? null : post.id)}
                  onShare={() => handleSharePost(post)}
                  onViewProfile={() => setViewingProfileUid(post.authorUid)}
                  onStartChat={() => {
                    if (!user) {
                      onOpenAuth();
                      return;
                    }
                    setActiveChatUser({ uid: post.authorUid, name: post.authorName, avatar: post.authorAvatar });
                    setActiveTab('messages');
                  }}
                  onFollow={() => handleFollowToggle(post.authorUid)}
                  onBlock={() => handleBlockToggle(post.authorUid)}
                  onDelete={() => handleDeletePost(post.id)}
                  onOpenMediaLightbox={(url, type, title) => setActiveLightbox({ url, type, title })}
                  isCommentsOpen={activeCommentPostId === post.id}
                  comments={activeCommentPostId === post.id ? comments : []}
                  newCommentText={newCommentText}
                  onChangeCommentText={setNewCommentText}
                  onAddComment={() => handleAddComment(post.id)}
                  isSubmittingComment={isSubmittingComment}
                />
              ))}
            </div>
          )}

        </div>
      )}

      {/* TAB 2: DIRECT MESSAGES VIEW */}
      {activeTab === 'messages' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          
          {/* Conversation List (4 cols on desktop) */}
          <div className="md:col-span-4 liquid-glass-card rounded-3xl p-4 shadow-md space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-black/10 dark:border-white/10">
              <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Direct Messages
              </h2>
              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                P2P Encrypted
              </span>
            </div>

            {conversations.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 dark:text-neutral-400">
                <Mail className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-60" />
                <p>No active conversations yet.</p>
                <p className="mt-1 text-[11px]">Click 'Message' on any user's post or profile to chat privately.</p>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
                {conversations.map((conv) => {
                  const isActive = activeChatUser?.uid === conv.otherUid;
                  return (
                    <button
                      key={conv.conversationId}
                      type="button"
                      onClick={() => {
                        triggerHaptic('tap');
                        setActiveChatUser({ uid: conv.otherUid, name: conv.otherName, avatar: conv.otherAvatar });
                      }}
                      className={`w-full text-left p-2.5 rounded-2xl transition flex items-center justify-between gap-2.5 ${
                        isActive 
                          ? 'liquid-glass-accent text-white shadow-md' 
                          : 'liquid-glass-button text-slate-800 dark:text-neutral-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-500 font-bold flex items-center justify-center shrink-0 overflow-hidden text-xs">
                          {conv.otherAvatar ? (
                            <img src={conv.otherAvatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            conv.otherName[0]?.toUpperCase() || 'U'
                          )}
                        </div>
                        <div className="truncate">
                          <p className="font-bold text-xs truncate">{conv.otherName}</p>
                          <p className="text-[11px] opacity-75 truncate">{conv.lastMessage || 'Sent attachment'}</p>
                        </div>
                      </div>

                      {(conv.unreadCount || 0) > 0 && !isActive && (
                        <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-[10px] font-black flex items-center justify-center shrink-0">
                          {conv.unreadCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Chat Window (8 cols on desktop) */}
          <div className="md:col-span-8 liquid-glass-card rounded-3xl p-4 sm:p-5 shadow-md flex flex-col h-[580px]">
            {activeChatUser ? (
              <>
                {/* Chat Header */}
                <div className="flex items-center justify-between pb-3 border-b border-black/10 dark:border-white/10 shrink-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-500 font-bold flex items-center justify-center shrink-0 overflow-hidden text-xs">
                      {activeChatUser.avatar ? (
                        <img src={activeChatUser.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        activeChatUser.name[0]?.toUpperCase()
                      )}
                    </div>
                    <div className="truncate">
                      <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
                        {activeChatUser.name}
                      </p>
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                        Realtime Direct Channel Active
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setViewingProfileUid(activeChatUser.uid)}
                      className="px-2.5 py-1.5 rounded-xl liquid-glass-button text-[11px] font-semibold text-slate-700 dark:text-neutral-300"
                    >
                      Profile
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBlockToggle(activeChatUser.uid)}
                      className="p-2 rounded-xl liquid-glass-button text-rose-500 hover:bg-rose-500/10"
                      title="Block user"
                    >
                      <ShieldAlert className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Messages Body */}
                <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1">
                  {chatMessages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-neutral-400 text-xs">
                      <MessageCircle className="w-8 h-8 opacity-40 mb-2" />
                      <p>Start a conversation with {activeChatUser.name}.</p>
                    </div>
                  ) : (
                    chatMessages.map((msg) => {
                      const isMe = msg.senderUid === user?.uid;
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[78%] rounded-2xl p-3 text-xs sm:text-sm ${
                              isMe
                                ? 'liquid-glass-accent text-white shadow-md'
                                : 'liquid-glass-input text-slate-900 dark:text-white'
                            }`}
                          >
                            {msg.text && <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>}

                            {msg.mediaUrl && (
                              <div className="mt-2 rounded-xl overflow-hidden bg-black/40">
                                {msg.mediaType === 'video' ? (
                                  <video
                                    src={msg.mediaUrl}
                                    controls
                                    playsInline
                                    className="w-full max-h-52 rounded-xl object-contain"
                                  />
                                ) : (
                                  <img
                                    src={msg.mediaUrl}
                                    alt="attachment"
                                    onClick={() => setActiveLightbox({ url: msg.mediaUrl!, type: 'image' })}
                                    className="w-full max-h-52 rounded-xl object-cover cursor-pointer hover:opacity-90 transition"
                                  />
                                )}
                              </div>
                            )}

                            <span className="block text-[9px] opacity-70 mt-1 text-right font-mono">
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={chatBottomRef} />
                </div>

                {/* Chat Input */}
                <div className="pt-3 border-t border-black/10 dark:border-white/10 shrink-0">
                  {chatMediaFile && (
                    <div className="mb-2 p-2 rounded-xl liquid-glass-input flex items-center justify-between text-xs">
                      <span className="truncate max-w-[200px] font-mono text-emerald-600 dark:text-emerald-400">
                        📎 {chatMediaFile.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => setChatMediaFile(null)}
                        className="text-slate-400 hover:text-rose-500"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <input
                      ref={chatFileInputRef}
                      type="file"
                      accept="image/*,video/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) setChatMediaFile(f);
                      }}
                    />

                    <button
                      type="button"
                      onClick={() => chatFileInputRef.current?.click()}
                      className="min-h-[44px] min-w-[44px] rounded-2xl liquid-glass-button text-slate-600 dark:text-neutral-300 flex items-center justify-center shrink-0"
                      title="Attach photo/video"
                    >
                      <Camera className="w-4 h-4" />
                    </button>

                    <input
                      type="text"
                      placeholder={`Message ${activeChatUser.name}...`}
                      value={chatInputText}
                      onChange={(e) => setChatInputText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      className="flex-1 liquid-glass-input rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
                    />

                    <button
                      type="button"
                      onClick={handleSendMessage}
                      disabled={isSendingMessage || (!chatInputText.trim() && !chatMediaFile)}
                      className="min-h-[44px] min-w-[44px] rounded-2xl liquid-glass-accent text-white flex items-center justify-center shrink-0 shadow-md active:scale-95 disabled:opacity-40"
                    >
                      {isSendingMessage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 stroke-[2.5]" />}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 dark:text-neutral-400">
                <Mail className="w-12 h-12 stroke-[1.5] text-emerald-500/60 mb-3" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white mb-1">Select a Conversation</h3>
                <p className="text-xs max-w-sm">
                  Choose a user from the conversations list, or click on any author in the feed to message them directly.
                </p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* USER PROFILE MODAL / VIEW */}
      {viewingProfileUid && viewedProfile && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in"
          onClick={() => setViewingProfileUid(null)}
        >
          <div 
            className="relative w-full max-w-lg liquid-glass-card rounded-3xl p-6 shadow-2xl border border-white/20"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setViewingProfileUid(null)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full liquid-glass-button text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Profile Header */}
            <div className="flex flex-col items-center text-center pt-2 pb-4">
              <div className="w-20 h-20 rounded-3xl liquid-glass-accent text-white text-2xl font-black flex items-center justify-center shadow-xl shadow-emerald-500/25 mb-3 overflow-hidden">
                {viewedProfile.avatarUrl ? (
                  <img src={viewedProfile.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  viewedProfile.name[0]?.toUpperCase() || 'U'
                )}
              </div>

              <h2 className="text-xl font-black text-slate-900 dark:text-white">
                {viewedProfile.name}
              </h2>
              <p className="text-xs font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                @{viewedProfile.handle || viewedProfile.name.toLowerCase().replace(/\s+/g, '_')}
              </p>

              {viewedProfile.bio && (
                <p className="text-xs text-slate-600 dark:text-neutral-300 mt-2 max-w-sm">
                  {viewedProfile.bio}
                </p>
              )}

              {/* Stats Bar */}
              <div className="grid grid-cols-2 gap-4 w-full mt-4 py-3 border-y border-black/10 dark:border-white/10 font-mono text-center">
                <div>
                  <span className="block text-lg font-black text-slate-900 dark:text-white">
                    {viewedFollowCounts.followers}
                  </span>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider">Followers</span>
                </div>
                <div>
                  <span className="block text-lg font-black text-slate-900 dark:text-white">
                    {viewedFollowCounts.following}
                  </span>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider">Following</span>
                </div>
              </div>

              {/* Actions */}
              {user?.uid !== viewingProfileUid && (
                <div className="flex items-center gap-2.5 w-full mt-5">
                  <button
                    type="button"
                    onClick={() => handleFollowToggle(viewingProfileUid)}
                    className={`flex-1 min-h-[44px] rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition active:scale-95 shadow-md ${
                      isFollowingViewed
                        ? 'liquid-glass-button text-slate-800 dark:text-white'
                        : 'liquid-glass-accent text-white'
                    }`}
                  >
                    {isFollowingViewed ? <UserCheck className="w-4 h-4 text-emerald-500" /> : <UserPlus className="w-4 h-4" />}
                    <span>{isFollowingViewed ? 'Following' : 'Follow'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setViewingProfileUid(null);
                      setActiveChatUser({ uid: viewingProfileUid, name: viewedProfile.name, avatar: viewedProfile.avatarUrl });
                      setActiveTab('messages');
                    }}
                    className="flex-1 min-h-[44px] rounded-2xl liquid-glass-button text-slate-800 dark:text-white text-xs font-black flex items-center justify-center gap-2 transition active:scale-95 shadow-sm"
                  >
                    <Mail className="w-4 h-4 text-emerald-500" />
                    <span>Direct Message</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleBlockToggle(viewingProfileUid)}
                    className="min-h-[44px] px-3 rounded-2xl liquid-glass-button text-rose-500 hover:bg-rose-500/10 text-xs font-bold transition flex items-center justify-center"
                    title="Block User"
                  >
                    <ShieldAlert className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MEDIA LIGHTBOX MODAL */}
      {activeLightbox && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in"
          onClick={() => setActiveLightbox(null)}
        >
          <div 
            className="relative w-full max-w-4xl liquid-glass-card rounded-3xl p-4 overflow-hidden border border-white/20"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-white/10">
              <span className="text-xs font-bold text-white truncate max-w-md">
                {activeLightbox.title || 'Media Lightbox'}
              </span>
              <button
                type="button"
                onClick={() => setActiveLightbox(null)}
                className="w-8 h-8 rounded-xl bg-white/10 text-white flex items-center justify-center hover:bg-white/20"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative rounded-2xl overflow-hidden bg-black flex items-center justify-center min-h-[260px] max-h-[75vh]">
              {activeLightbox.type === 'video' ? (
                <video
                  src={activeLightbox.url}
                  controls
                  autoPlay
                  playsInline
                  preload="auto"
                  className="w-full max-h-[75vh] rounded-2xl object-contain"
                />
              ) : (
                <img
                  src={activeLightbox.url}
                  alt=""
                  className="w-full max-h-[75vh] rounded-2xl object-contain"
                />
              )}
            </div>

            <div className="flex justify-end pt-3 mt-2 border-t border-white/10">
              <a
                href={activeLightbox.url}
                target="_blank"
                rel="noreferrer"
                download
                className="min-h-[40px] px-4 rounded-xl liquid-glass-accent text-white text-xs font-bold flex items-center gap-2 shadow-md"
              >
                <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Save to Device</span>
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

/**
 * Sub-Component: Individual Post Card with Live Like/Comment and strict 2px RGB outline
 */
const PostCard: React.FC<{
  post: CommunityPost;
  currentUserUid: string | null;
  onLike: () => void;
  onOpenComments: () => void;
  onShare: () => void;
  onViewProfile: () => void;
  onStartChat: () => void;
  onFollow: () => void;
  onBlock: () => void;
  onDelete: () => void;
  onOpenMediaLightbox: (url: string, type: 'video' | 'image', title?: string) => void;
  isCommentsOpen: boolean;
  comments: CommunityComment[];
  newCommentText: string;
  onChangeCommentText: (val: string) => void;
  onAddComment: () => void;
  isSubmittingComment: boolean;
}> = ({
  post,
  currentUserUid,
  onLike,
  onOpenComments,
  onShare,
  onViewProfile,
  onStartChat,
  onFollow,
  onBlock,
  onDelete,
  onOpenMediaLightbox,
  isCommentsOpen,
  comments,
  newCommentText,
  onChangeCommentText,
  onAddComment,
  isSubmittingComment,
}) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const isAuthor = currentUserUid === post.authorUid;

  // Realtime like status
  useEffect(() => {
    const unsub = subscribePostLikeStatus(post.id, currentUserUid, setIsLiked);
    return () => unsub();
  }, [post.id, currentUserUid]);

  // Realtime follow status
  useEffect(() => {
    if (!currentUserUid || isAuthor) return;
    const unsub = subscribeIsFollowing(currentUserUid, post.authorUid, setIsFollowing);
    return () => unsub();
  }, [currentUserUid, post.authorUid, isAuthor]);

  return (
    <div className="liquid-glass-card rounded-3xl p-4 sm:p-5 shadow-md border border-white/20 dark:border-white/10 hover:border-emerald-500/30 transition-all">
      
      {/* Post Header: Avatar, Name, Handle, Timestamp, Menu */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onViewProfile}
            className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-black flex items-center justify-center shrink-0 overflow-hidden text-sm shadow-sm"
          >
            {post.authorAvatar ? (
              <img src={post.authorAvatar} alt="" className="w-full h-full object-cover" />
            ) : (
              post.authorName[0]?.toUpperCase() || 'U'
            )}
          </button>

          <div className="truncate">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onViewProfile}
                className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white hover:text-emerald-500 transition truncate"
              >
                {post.authorName}
              </button>
              <span className="text-[10px] text-slate-500 dark:text-neutral-400 font-mono truncate hidden sm:inline">
                @{post.authorHandle || post.authorName.toLowerCase().replace(/\s+/g, '_')}
              </span>
            </div>
            <span className="text-[10px] text-slate-500 dark:text-neutral-400 font-mono">
              {new Date(post.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>

        {/* Header Right Actions: Follow toggle and 3-dots */}
        <div className="flex items-center gap-1.5 shrink-0 relative">
          {!isAuthor && currentUserUid && (
            <button
              type="button"
              onClick={onFollow}
              className={`px-3 py-1 rounded-xl text-[11px] font-bold transition flex items-center gap-1 ${
                isFollowing 
                  ? 'liquid-glass-button text-slate-700 dark:text-neutral-300' 
                  : 'liquid-glass-accent text-white shadow-sm'
              }`}
            >
              {isFollowing ? <UserCheck className="w-3 h-3 text-emerald-500" /> : <UserPlus className="w-3 h-3" />}
              <span>{isFollowing ? 'Following' : 'Follow'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-8 h-8 rounded-xl liquid-glass-button text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {/* Dropdown Menu */}
          {menuOpen && (
            <div className="absolute top-10 right-0 z-20 w-44 liquid-glass-card rounded-2xl p-1.5 shadow-2xl border border-white/20 animate-in fade-in zoom-in-95">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onViewProfile();
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-800 dark:text-neutral-200 hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-2"
              >
                <User className="w-3.5 h-3.5" />
                <span>View Profile</span>
              </button>

              {!isAuthor && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onStartChat();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-800 dark:text-neutral-200 hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-2"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Send Message</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onBlock();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 flex items-center gap-2"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Block User</span>
                  </button>
                </>
              )}

              {isAuthor && (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete();
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 flex items-center gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Post</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Post Text Content */}
      {post.content && (
        <p className="text-xs sm:text-sm text-slate-800 dark:text-neutral-200 leading-relaxed whitespace-pre-wrap mb-3">
          {post.content}
        </p>
      )}

      {/* Post Media Rendering (4K Video or Image or File) */}
      {post.mediaUrl && (
        <div className="mb-3 rounded-2xl overflow-hidden liquid-glass-input border border-black/10 dark:border-white/10 bg-black/60">
          {post.mediaType === 'video' ? (
            <div className="relative group">
              <video
                src={post.mediaUrl}
                controls
                playsInline
                preload="metadata"
                className="w-full max-h-[420px] rounded-2xl object-contain bg-black"
              >
                Your browser does not support video playback.
              </video>
            </div>
          ) : post.mediaType === 'image' ? (
            <img
              src={post.mediaUrl}
              alt=""
              onClick={() => onOpenMediaLightbox(post.mediaUrl!, 'image', post.content)}
              className="w-full max-h-[420px] object-cover cursor-pointer hover:opacity-95 transition"
            />
          ) : (
            <div className="p-4 flex items-center justify-between text-xs">
              <span className="font-mono text-slate-700 dark:text-neutral-300 truncate max-w-xs">
                📎 {post.mediaName || 'Attached File'} ({formatBytes(post.mediaSize || 0)})
              </span>
              <a
                href={post.mediaUrl}
                target="_blank"
                rel="noreferrer"
                download
                className="px-3 py-1.5 rounded-xl liquid-glass-accent text-white font-bold flex items-center gap-1.5 shadow-sm"
              >
                <Download className="w-3 h-3" />
                <span>Download</span>
              </a>
            </div>
          )}
        </div>
      )}

      {/* Post Footer Action Buttons (Like, Comment, Share) */}
      <div className="flex items-center justify-between pt-2 border-t border-black/10 dark:border-white/10 text-xs">
        <div className="flex items-center gap-3">
          
          {/* Like Button with burst animation */}
          <button
            type="button"
            onClick={onLike}
            className={`min-h-[36px] flex items-center gap-1.5 px-3 py-1.5 rounded-xl liquid-glass-button transition active:scale-90 ${
              isLiked
                ? 'text-rose-500 font-bold bg-rose-500/10'
                : 'text-slate-600 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-500 text-rose-500 scale-110' : ''}`} />
            <span className="font-mono">{post.likesCount || 0}</span>
          </button>

          {/* Comment Drawer Toggle */}
          <button
            type="button"
            onClick={onOpenComments}
            className={`min-h-[36px] flex items-center gap-1.5 px-3 py-1.5 rounded-xl liquid-glass-button transition ${
              isCommentsOpen 
                ? 'text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10' 
                : 'text-slate-600 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span className="font-mono">{post.commentsCount || 0}</span>
          </button>
        </div>

        {/* Share Button */}
        <button
          type="button"
          onClick={onShare}
          className="min-h-[36px] flex items-center gap-1.5 px-3 py-1.5 rounded-xl liquid-glass-button text-slate-600 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white transition active:scale-95"
          title="Share Post"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Share</span>
        </button>
      </div>

      {/* Realtime Comments Section */}
      {isCommentsOpen && (
        <div className="mt-4 pt-3 border-t border-black/10 dark:border-white/10 space-y-3 animate-in fade-in">
          
          {/* Add Comment Input */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder={currentUserUid ? "Write a comment..." : "Sign in to comment..."}
              disabled={!currentUserUid || isSubmittingComment}
              value={newCommentText}
              onChange={(e) => onChangeCommentText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  onAddComment();
                }
              }}
              className="flex-1 liquid-glass-input rounded-2xl px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
            />
            <button
              type="button"
              onClick={onAddComment}
              disabled={!currentUserUid || isSubmittingComment || !newCommentText.trim()}
              className="min-h-[36px] px-3.5 py-1.5 rounded-xl liquid-glass-accent text-white text-xs font-bold shadow-md active:scale-95 disabled:opacity-40"
            >
              {isSubmittingComment ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Reply'}
            </button>
          </div>

          {/* Comments List */}
          {comments.length === 0 ? (
            <p className="text-[11px] text-slate-500 font-mono text-center py-2">
              No comments yet. Start the conversation!
            </p>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {comments.map((c) => (
                <div
                  key={c.id}
                  className="p-2.5 rounded-2xl liquid-glass-input text-xs space-y-1"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {c.authorName}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-slate-700 dark:text-neutral-300 leading-relaxed">
                    {c.text}
                  </p>
                </div>
              ))}
            </div>
          )}

        </div>
      )}

    </div>
  );
};
