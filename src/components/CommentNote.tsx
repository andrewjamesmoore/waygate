import { useState } from "react";
import { useNostr } from "../context/NostrContext";
import { SimplePool, type UnsignedEvent, finalizeEvent } from "nostr-tools";
import {
  Box,
  Button,
  Flex,
  Textarea,
  useToast,
  useColorModeValue,
} from "@chakra-ui/react";

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
  const toast = useToast();
  const [isPosting, setIsPosting] = useState(false);
  const inputBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!privateKey || !publicKey || !content.trim() || !parentId) return;

    setIsPosting(true);
    toast({
      title: "Posting...",
      description: "Sending your comment",
      status: "info",
      duration: 2000,
      isClosable: true,
      position: "bottom",
    });

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
        toast({
          title: "Success!",
          description: "Your comment was posted successfully",
          status: "success",
          duration: 3000,
          isClosable: true,
          position: "bottom",
        });

        // Notify parent component
        if (onCommentAdded) {
          onCommentAdded();
        }
      } else {
        console.error("Failed to publish comment to any relay");
        toast({
          title: "Error",
          description: "Failed to post comment. Please try again.",
          status: "error",
          duration: 3000,
          isClosable: true,
          position: "bottom",
        });
      }
    } catch (error: unknown) {
      console.error("Failed to post comment:", error);
      toast({
        title: "Error",
        description:
          "Failed to post comment. Please check your connection and try again.",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "bottom",
      });
    } finally {
      setIsPosting(false);
    }
  };

  if (!privateKey) {
    return null;
  }

  return (
    <Box width='100%'>
      <form onSubmit={handleSubmit}>
        <Flex>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder='Write a reply...'
            size='xs'
            resize='none'
            rows={1}
            mr={2}
            bg={inputBg}
            borderColor={borderColor}
            isDisabled={isPosting}
            _focus={{
              borderColor: "brand.500",
              boxShadow: "0 0 0 1px var(--chakra-colors-brand-500)",
            }}
            flex='1'
            fontSize='sm'
            py={1}
            minH='30px'
          />
          <Button
            type='submit'
            colorScheme='brand'
            isLoading={isPosting}
            loadingText='...'
            isDisabled={!content.trim() || isPosting}
            size='xs'
            alignSelf='flex-end'
            height='30px'
          >
            Reply
          </Button>
        </Flex>
      </form>
    </Box>
  );
};
