import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  getPublicKey,
  nip19,
  SimplePool,
  type Event,
  type Filter,
  type UnsignedEvent,
  finalizeEvent,
} from "nostr-tools";
import { randomBytes } from "@noble/hashes/utils";
import { bytesToHex } from "@noble/hashes/utils";

const hexToBytes = (hex: string) => {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    const hexByte = hex.substr(i * 2, 2);
    bytes[i] = parseInt(hexByte, 16);
  }
  return bytes;
};

const generatePrivateKey = (): string => {
  return bytesToHex(randomBytes(32));
};

const RELAYS = [
  "wss://relay.damus.io",
  "wss://relay.nostr.band",
  "wss://nos.lol",
];

const pool = new SimplePool();

interface Post extends Event {
  content: string;
  created_at: number;
  pubkey: string;
  comments?: Post[]; // Array of comments for this post
}

interface NostrContextType {
  privateKey: string | null;
  publicKey: string | null;
  npub: string | null;
  generateNewKey: () => void;
  setPrivateKey: (key: string) => void;
  profile: {
    name: string;
    about: string;
    avatar: string;
  };
  updateProfile: (name: string, about: string, avatar: string) => void;
  posts: Post[];
  addPost: (post: Post) => void;
  addComment: (comment: Post, parentId: string) => void;
  following: string[]; // Array of pubkeys that the user is following
  followUser: (pubkey: string) => void;
  unfollowUser: (pubkey: string) => void;
  isFollowing: (pubkey: string) => boolean;
  getProfileByPubkey: (pubkey: string) => Promise<{
    name: string;
    about: string;
    picture: string;
  } | null>;
}

const NostrContext = createContext<NostrContextType | null>(null);

export const NostrProvider = ({ children }: { children: ReactNode }) => {
  const [privateKey, setPrivateKeyState] = useState<string | null>(() => {
    const stored = localStorage.getItem("nostr_private_key");
    return stored || null;
  });

  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [npub, setNpub] = useState<string | null>(null);
  const [profile, setProfile] = useState(() => {
    // If we have a private key, try to load the profile for that key
    const stored = localStorage.getItem("nostr_private_key");
    if (stored) {
      const profileKey = `nostr_profile_${stored}`;
      const storedProfile = localStorage.getItem(profileKey);
      if (storedProfile) {
        return JSON.parse(storedProfile);
      }
    }

    // Default empty profile
    return {
      name: "",
      about: "",
      avatar: "",
    };
  });
  const [posts, setPosts] = useState<Post[]>([]);

  // State for followed users
  const [following, setFollowing] = useState<string[]>(() => {
    // Load followed users from localStorage
    const stored = localStorage.getItem("nostr_private_key");
    if (stored) {
      const followingKey = `nostr_following_${stored}`;
      const storedFollowing = localStorage.getItem(followingKey);
      if (storedFollowing) {
        return JSON.parse(storedFollowing);
      }
    }
    return [];
  });

  // Cache for profiles
  const [profileCache, setProfileCache] = useState<
    Record<
      string,
      {
        name: string;
        about: string;
        picture: string;
        lastFetched: number;
      }
    >
  >({});

  const addPost = (post: Post) => {
    // Check if this is a reply to another post
    const replyToTag = post.tags?.find((tag) => tag[0] === "e");

    if (replyToTag) {
      // This is a comment/reply
      const parentId = replyToTag[1];
      addComment(post, parentId);
    } else {
      // This is a top-level post
      setPosts((prev) => {
        if (prev.some((p) => p.id === post.id)) return prev;
        return [post, ...prev].sort((a, b) => b.created_at - a.created_at);
      });
    }
  };

  const addComment = (comment: Post, parentId: string) => {
    setPosts((prev) => {
      // Find the parent post
      const updatedPosts = [...prev];
      const parentIndex = updatedPosts.findIndex((p) => p.id === parentId);

      if (parentIndex !== -1) {
        // Parent post found
        const parentPost = updatedPosts[parentIndex];

        // Initialize comments array if it doesn't exist
        if (!parentPost.comments) {
          parentPost.comments = [];
        }

        // Add comment if it doesn't already exist
        if (!parentPost.comments.some((c) => c.id === comment.id)) {
          parentPost.comments = [...parentPost.comments, comment].sort(
            (a, b) => a.created_at - b.created_at
          ); // Sort comments chronologically

          // Update the parent post
          updatedPosts[parentIndex] = parentPost;
        }

        return updatedPosts;
      }

      return prev;
    });
  };

  // Subscribe to posts, comments, and profile metadata
  useEffect(() => {
    if (!publicKey) return;

    // Combine the user's pubkey with followed pubkeys
    const authors = [publicKey, ...following];

    // Filter for posts (kind 1)
    const postFilter: Filter = {
      kinds: [1],
      authors: authors,
      limit: 100,
    };

    // Filter for comments (kind 1 with e tag)
    const commentFilter: Filter = {
      kinds: [1],
      "#e": [], // Any e tag (reference to another event)
      authors: authors,
      limit: 100,
    };

    // Filter for profile metadata (kind 0)
    const metadataFilter: Filter = {
      kinds: [0],
      authors: authors,
      limit: authors.length,
    };

    console.log(`Subscribing to posts from ${authors.length} authors`);

    // Subscribe to posts, comments, and metadata
    const sub = pool.subscribeMany(
      RELAYS,
      [postFilter, commentFilter, metadataFilter],
      {
        onevent(event: Event) {
          if (event.kind === 1) {
            // Handle post event
            addPost(event as Post);
          } else if (event.kind === 0) {
            // Handle metadata event
            try {
              const metadata = JSON.parse(event.content);
              if (metadata) {
                // If this is the user's own metadata
                if (event.pubkey === publicKey) {
                  setProfile({
                    name: metadata.name || "",
                    about: metadata.about || "",
                    avatar: metadata.picture || "",
                  });

                  // Save to localStorage
                  if (privateKey) {
                    const profileKey = `nostr_profile_${privateKey}`;
                    localStorage.setItem(
                      profileKey,
                      JSON.stringify({
                        name: metadata.name || "",
                        about: metadata.about || "",
                        avatar: metadata.picture || "",
                      })
                    );
                  }
                }

                // Cache the profile data
                setProfileCache((prev) => ({
                  ...prev,
                  [event.pubkey]: {
                    name: metadata.name || "",
                    about: metadata.about || "",
                    picture: metadata.picture || "",
                    lastFetched: Date.now(),
                  },
                }));
              }
            } catch (e) {
              console.error("Failed to parse profile metadata:", e);
            }
          }
        },
      }
    );

    return () => {
      sub.close();
      pool.close(RELAYS);
    };
  }, [publicKey, following]);

  useEffect(() => {
    if (privateKey) {
      const pub = getPublicKey(hexToBytes(privateKey));
      setPublicKey(pub);
      setNpub(nip19.npubEncode(pub));
      localStorage.setItem("nostr_private_key", privateKey);

      // Load profile for this key if it exists
      const profileKey = `nostr_profile_${privateKey}`;
      const storedProfile = localStorage.getItem(profileKey);
      if (storedProfile) {
        setProfile(JSON.parse(storedProfile));
      }
    } else {
      setPublicKey(null);
      setNpub(null);
      localStorage.removeItem("nostr_private_key");
    }
  }, [privateKey]);

  const generateNewKey = () => {
    // Create a new key
    const newPrivateKey = generatePrivateKey();

    // Reset profile for the new key
    setProfile({
      name: "",
      about: "",
      avatar: "",
    });

    setPrivateKeyState(newPrivateKey);

    // Log for debugging
    console.log("New key generated:", newPrivateKey.substring(0, 8) + "...");
  };

  const setPrivateKey = (key: string) => {
    // If setting a new key (not just logging out)
    if (key && key !== privateKey) {
      // We'll load the profile for this key in the useEffect
      setPrivateKeyState(key);
    } else {
      // Logging out
      setPrivateKeyState(key);
      setProfile({
        name: "",
        about: "",
        avatar: "",
      });
    }
  };

  // Publish profile metadata to the Nostr network
  const publishProfileMetadata = async (
    name: string,
    about: string,
    avatar: string
  ) => {
    if (!privateKey || !publicKey) {
      console.error("Cannot publish metadata: No private or public key");
      return;
    }

    try {
      // Create metadata content according to NIP-01 spec
      const metadata = {
        name: name,
        about: about,
        picture: avatar,
      };

      console.log("Publishing metadata:", metadata);

      // Create unsigned event
      const event: UnsignedEvent = {
        kind: 0, // kind 0 is for metadata
        pubkey: publicKey,
        created_at: Math.floor(Date.now() / 1000),
        tags: [],
        content: JSON.stringify(metadata),
      };

      // Sign the event
      const signedEvent = finalizeEvent(event, hexToBytes(privateKey));

      // Publish to relays
      const pubs = pool.publish(RELAYS, signedEvent);

      // Wait for publication to complete
      const results = await Promise.allSettled(pubs);

      // Log results for debugging
      console.log(
        "Metadata publication results:",
        results
          .map((r) => (r.status === "fulfilled" ? "success" : "failed"))
          .join(", ")
      );

      // Check if at least one relay accepted the event
      const successCount = results.filter(
        (r) => r.status === "fulfilled"
      ).length;
      if (successCount > 0) {
        console.log(
          `Profile metadata published successfully to ${successCount}/${RELAYS.length} relays`
        );
      } else {
        console.error("Failed to publish metadata to any relay");
      }
    } catch (error) {
      console.error("Failed to publish profile metadata:", error);
    }
  };

  const updateProfile = (name: string, about: string, avatar: string) => {
    const updatedProfile = { name, about, avatar };
    setProfile(updatedProfile);

    // Save profile with key-specific storage key
    if (privateKey) {
      const profileKey = `nostr_profile_${privateKey}`;
      localStorage.setItem(profileKey, JSON.stringify(updatedProfile));

      // Publish to Nostr network
      publishProfileMetadata(name, about, avatar);

      console.log("Profile updated and published:", {
        name,
        about,
        avatar: avatar.substring(0, 30) + "...",
      });
    } else {
      console.error("Cannot update profile: No private key");
    }
  };

  // Function to follow a user
  const followUser = (pubkey: string) => {
    if (following.includes(pubkey)) return; // Already following

    const newFollowing = [...following, pubkey];
    setFollowing(newFollowing);

    // Save to localStorage
    if (privateKey) {
      const followingKey = `nostr_following_${privateKey}`;
      localStorage.setItem(followingKey, JSON.stringify(newFollowing));
    }

    console.log(`Now following ${pubkey}`);
  };

  // Function to unfollow a user
  const unfollowUser = (pubkey: string) => {
    const newFollowing = following.filter((p) => p !== pubkey);
    setFollowing(newFollowing);

    // Save to localStorage
    if (privateKey) {
      const followingKey = `nostr_following_${privateKey}`;
      localStorage.setItem(followingKey, JSON.stringify(newFollowing));
    }

    console.log(`Unfollowed ${pubkey}`);
  };

  // Function to check if following a user
  const isFollowing = (pubkey: string) => {
    return following.includes(pubkey);
  };

  // Function to get a profile by pubkey
  const getProfileByPubkey = async (pubkey: string) => {
    // Check cache first
    const cached = profileCache[pubkey];
    if (cached && Date.now() - cached.lastFetched < 1000 * 60 * 5) {
      // 5 minute cache
      return {
        name: cached.name,
        about: cached.about,
        picture: cached.picture,
      };
    }

    // Not in cache, fetch from network
    try {
      const filter: Filter = {
        kinds: [0],
        authors: [pubkey],
        limit: 1,
      };

      // Query each relay individually and combine results
      const events: Event[] = [];
      for (const relay of RELAYS) {
        try {
          const event = await pool.get([relay], filter);
          if (event) {
            events.push(event);
            break; // We only need one valid metadata event
          }
        } catch (e) {
          console.log(`Failed to fetch from relay ${relay}:`, e);
        }
      }
      if (events.length > 0) {
        const metadata = JSON.parse(events[0].content);

        // Update cache
        setProfileCache((prev) => ({
          ...prev,
          [pubkey]: {
            name: metadata.name || "",
            about: metadata.about || "",
            picture: metadata.picture || "",
            lastFetched: Date.now(),
          },
        }));

        return {
          name: metadata.name || "",
          about: metadata.about || "",
          picture: metadata.picture || "",
        };
      }
    } catch (error) {
      console.error(`Failed to fetch profile for ${pubkey}:`, error);
    }

    return null;
  };

  return (
    <NostrContext.Provider
      value={{
        privateKey,
        publicKey,
        npub,
        generateNewKey,
        setPrivateKey,
        profile,
        updateProfile,
        posts,
        addPost,
        addComment,
        following,
        followUser,
        unfollowUser,
        isFollowing,
        getProfileByPubkey,
      }}
    >
      {children}
    </NostrContext.Provider>
  );
};

export const useNostr = () => {
  const context = useContext(NostrContext);
  if (!context) {
    throw new Error("useNostr must be used within a NostrProvider");
  }
  return context;
};
