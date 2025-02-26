import { useState } from "react";
import { useNostr } from "../context/NostrContext";
import { SimplePool, type UnsignedEvent, finalizeEvent } from "nostr-tools";

const hexToBytes = (hex: string) => {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    const hexByte = hex.substr(i * 2, 2);
    bytes[i] = parseInt(hexByte, 16);
  }
  return bytes;
};

const pool = new SimplePool();
const RELAYS = [
  "wss://relay.damus.io",
  "wss://relay.nostr.band",
  "wss://nos.lol",
];

export const PostNote = () => {
  const { privateKey, publicKey, addPost, profile } = useNostr();
  const [content, setContent] = useState("");
  const [status, setStatus] = useState("");
  const [isPosting, setIsPosting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!privateKey || !publicKey || !content.trim()) return;

    setIsPosting(true);
    setStatus("Posting note...");

    try {
      // Create metadata for the post
      const metadata = {
        name: profile.name || "",
        about: profile.about || "",
        picture: profile.avatar || "",
      };

      // For debugging
      console.log("Posting with metadata:", metadata);

      const event: UnsignedEvent = {
        kind: 1,
        pubkey: publicKey,
        created_at: Math.floor(Date.now() / 1000),
        tags: [
          // Add profile reference tags according to NIP-08
          ["p", publicKey, "", "mention"],
          // Include metadata directly in the post
          ["metadata", JSON.stringify(metadata)],
        ],
        content: content.trim(),
      };

      const signedEvent = finalizeEvent(event, hexToBytes(privateKey));

      const pubs = pool.publish(RELAYS, signedEvent);
      const results = await Promise.allSettled(pubs);

      // Check if at least one relay accepted the event
      const successCount = results.filter(
        (r) => r.status === "fulfilled"
      ).length;

      // Log results for debugging
      console.log(
        "Post publication results:",
        results
          .map((r) => (r.status === "fulfilled" ? "success" : "failed"))
          .join(", ")
      );

      if (successCount > 0) {
        console.log(
          `Post published successfully to ${successCount}/${RELAYS.length} relays`
        );

        // Add the post to the local state immediately
        addPost(signedEvent);

        setContent("");
        setStatus("Note posted successfully!");
        setTimeout(() => setStatus(""), 3000);
      } else {
        console.error("Failed to publish post to any relay");
        setStatus("Failed to post note. Please try again.");
      }
    } catch (error: unknown) {
      console.error("Failed to post note:", error);
      setStatus(
        "Failed to post note. Please check your connection and try again."
      );
    } finally {
      setIsPosting(false);
    }
  };

  if (!privateKey) {
    return (
      <div className='post-note'>
        <h2>Post a Note</h2>
        <p>Please add a key to post notes.</p>
      </div>
    );
  }

  return (
    <div className='post-note'>
      <h2>Post a Note</h2>
      <form onSubmit={handleSubmit}>
        <div className='form-group'>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            rows={4}
            disabled={isPosting}
          />
        </div>

        <button type='submit' disabled={!content.trim() || isPosting}>
          {isPosting ? "Posting..." : "Post"}
        </button>
      </form>

      {status && (
        <p
          className={`status ${
            status.includes("Failed") ? "error" : "success"
          }`}
        >
          {status}
        </p>
      )}
    </div>
  );
};
