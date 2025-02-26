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
  Text,
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

export const PostNote = () => {
  const { privateKey, publicKey, addPost, profile } = useNostr();
  const [content, setContent] = useState("");
  const toast = useToast();
  const [isPosting, setIsPosting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!privateKey || !publicKey || !content.trim()) return;

    setIsPosting(true);
    toast({
      title: "Posting...",
      description: "Sending your note to the network",
      status: "info",
      duration: 2000,
      isClosable: true,
      position: "bottom",
    });

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
        toast({
          title: "Success!",
          description: "Your note was posted successfully",
          status: "success",
          duration: 3000,
          isClosable: true,
          position: "bottom",
        });
      } else {
        console.error("Failed to publish post to any relay");
        toast({
          title: "Error",
          description: "Failed to post note. Please try again.",
          status: "error",
          duration: 3000,
          isClosable: true,
          position: "bottom",
        });
      }
    } catch (error: unknown) {
      console.error("Failed to post note:", error);
      toast({
        title: "Error",
        description:
          "Failed to post note. Please check your connection and try again.",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "bottom",
      });
    } finally {
      setIsPosting(false);
    }
  };

  const inputBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");

  if (!privateKey) {
    return (
      <Box>
        <Text color='gray.500' textAlign='center'>
          Please add a key to post notes.
        </Text>
      </Box>
    );
  }

  return (
    <Box width='100%'>
      <form onSubmit={handleSubmit}>
        <Flex>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's happening?"
            size='sm'
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
          />
          <Button
            type='submit'
            colorScheme='brand'
            isLoading={isPosting}
            loadingText='...'
            isDisabled={!content.trim() || isPosting}
            size='sm'
            alignSelf='flex-end'
          >
            Post
          </Button>
        </Flex>
      </form>
    </Box>
  );
};
