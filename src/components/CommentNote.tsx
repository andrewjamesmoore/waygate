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

interface CommentNoteProps {
  parentId: string;
  onCommentAdded?: () => void;
}

export const CommentNote = ({ parentId, onCommentAdded }: CommentNoteProps) => {
  const { privateKey, publicKey, profile, addComment } = useNostr();
  const [content, setContent] = useState("");
  const [status, setStatus] = useState("");
  const [isPosting, setIsPosting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!privateKey || !publicKey || !content.trim() || !parentId) return;

    setIsPosting(true);
    setStatus("Posting comment...");

    try {
      // Create metadata for the comment
      const metadata = {
        name: profile.name || "",
        about: profile.about || "",
        picture: profile.avatar || "",
      };

      // Create unsigned event
      const event: UnsignedEvent = {
        kind: 1,
        pubkey: publicKey,
        created_at: Math.floor(Date.now() / 1000),
        tags: [
          // Add reference to parent post (e tag)
          ["e", parentId, "", "reply"],
          // Add profile reference tags
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

      if (successCount > 0) {
        console.log(
          `Comment published successfully to ${successCount}/${RELAYS.length} relays`
        );

        // Add the comment to the local state
        addComment(signedEvent, parentId);

        setContent("");
        setStatus("Comment posted successfully!");

        // Notify parent component
        if (onCommentAdded) {
          onCommentAdded();
        }

        setTimeout(() => setStatus(""), 3000);
      } else {
        console.error("Failed to publish comment to any relay");
        setStatus("Failed to post comment. Please try again.");
      }
    } catch (error: unknown) {
      console.error("Failed to post comment:", error);
      setStatus(
        "Failed to post comment. Please check your connection and try again."
      );
    } finally {
      setIsPosting(false);
    }
  };

  if (!privateKey) {
    return null;
  }

  return (
    <div className='comment-note'>
      <form onSubmit={handleSubmit} className='comment-form'>
        <div className='form-group'>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder='Write a comment...'
            rows={1}
            disabled={isPosting}
          />
        </div>

        <button type='submit' disabled={!content.trim() || isPosting}>
          {isPosting ? "..." : "Reply"}
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
