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
  };
  updateProfile: (name: string, about: string) => void;
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
  const [profile, setProfile] = useState({
    name: "",
    about: "",
  });
  const [posts, setPosts] = useState<Post[]>([]);

  const addPost = (post: Post) => {
    setPosts((prev) => {
      if (prev.some((p) => p.id === post.id)) return prev;
      return [post, ...prev].sort((a, b) => b.created_at - a.created_at);
    });
  };

  // Subscribe to posts
  useEffect(() => {
    if (!publicKey) return;

    const filter: Filter = {
      kinds: [1],
      authors: [publicKey],
      limit: 20,
    };

    // Subscribe to posts
    const sub = pool.subscribeMany(RELAYS, [filter], {
      onevent(event: Event) {
        addPost(event as Post);
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
    } else {
      setPublicKey(null);
      setNpub(null);
      localStorage.removeItem("nostr_private_key");
    }
  }, [privateKey]);

  const generateNewKey = () => {
    const newPrivateKey = generatePrivateKey();
    setPrivateKeyState(newPrivateKey);
  };

  const setPrivateKey = (key: string) => {
    setPrivateKeyState(key);
  };

  const updateProfile = (name: string, about: string) => {
    setProfile({ name, about });
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
