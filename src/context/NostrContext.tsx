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

  const addPost = (post: Post) => {
    setPosts((prev) => {
      if (prev.some((p) => p.id === post.id)) return prev;
      return [post, ...prev].sort((a, b) => b.created_at - a.created_at);
    });
  };

  // Subscribe to posts and profile metadata
  useEffect(() => {
    if (!publicKey) return;

    // Filter for posts (kind 1)
    const postFilter: Filter = {
      kinds: [1],
      authors: [publicKey],
      limit: 20,
    };

    // Filter for profile metadata (kind 0)
    const metadataFilter: Filter = {
      kinds: [0],
      authors: [publicKey],
      limit: 1,
    };

    // Subscribe to posts and metadata
    const sub = pool.subscribeMany(RELAYS, [postFilter, metadataFilter], {
      onevent(event: Event) {
        if (event.kind === 1) {
          // Handle post event
          addPost(event as Post);
        } else if (event.kind === 0) {
          // Handle metadata event
          try {
            const metadata = JSON.parse(event.content);
            if (metadata) {
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
          } catch (e) {
            console.error("Failed to parse profile metadata:", e);
          }
        }
      },
    });

    return () => {
      sub.close();
      pool.close(RELAYS);
    };
  }, [publicKey]);

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
