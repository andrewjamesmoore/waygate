import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { PostNote } from "../components/PostNote";
import { CommentNote } from "../components/CommentNote";
import { useNostr } from "../context/NostrContext";
import {
  Box,
  VStack,
  Heading,
  Text,
  Avatar,
  Button,
  Flex,
  Spinner,
  useColorModeValue,
} from "@chakra-ui/react";
import { ChatIcon } from "@chakra-ui/icons";

// Type for post with author info
interface PostWithAuthor {
  id: string;
  content: string;
  created_at: number;
  pubkey: string;
  author: {
    name: string;
    picture: string;
  };
  comments?: CommentWithAuthor[];
}

// Type for comment with author info
interface CommentWithAuthor {
  id: string;
  content: string;
  created_at: number;
  pubkey: string;
  author: {
    name: string;
    picture: string;
  };
}

export const FeedPage = () => {
  const {
    privateKey,
    publicKey,
    posts,
    profile,
    getProfileByPubkey,
    followUser,
    unfollowUser,
    isFollowing,
  } = useNostr();
  const navigate = useNavigate();
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [postsWithAuthors, setPostsWithAuthors] = useState<PostWithAuthor[]>(
    []
  );
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(false);
  const [expandedCommentForms, setExpandedCommentForms] = useState<string[]>(
    []
  );
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!privateKey) {
      navigate("/login");
    }
  }, [privateKey, navigate]);

  // Load author profiles for posts
  useEffect(() => {
    let isMounted = true;

    const loadAuthorProfiles = async () => {
      if (isInitialLoad) {
        setIsInitialLoad(false);
      }

      const currentPosts = posts;

      // Only update if we have posts to show
      if (currentPosts.length === 0) {
        if (isMounted) setPostsWithAuthors([]);
        return;
      }

      if (isMounted) setIsLoadingProfiles(true);

      // Get unique pubkeys from posts
      const uniquePubkeys = [
        ...new Set(currentPosts.map((post) => post.pubkey)),
      ];
      const authorProfiles: Record<string, { name: string; picture: string }> =
        {};

      // Load profiles for each unique pubkey
      for (const pubkey of uniquePubkeys) {
        try {
          // If it's the user's own pubkey, use the local profile
          if (pubkey === publicKey) {
            authorProfiles[pubkey] = {
              name: profile.name || "You",
              picture: profile.avatar || "",
            };
            continue;
          }

          // Otherwise fetch from network
          const authorProfile = await getProfileByPubkey(pubkey);
          if (authorProfile) {
            authorProfiles[pubkey] = {
              name: authorProfile.name || "Anonymous",
              picture: authorProfile.picture || "",
            };
          } else {
            authorProfiles[pubkey] = {
              name: "Anonymous",
              picture: "",
            };
          }
        } catch (error) {
          console.error(`Failed to load profile for ${pubkey}:`, error);
          authorProfiles[pubkey] = {
            name: "Anonymous",
            picture: "",
          };
        }
      }

      // Combine posts with author profiles and process comments
      const enrichedPosts = currentPosts.map((post) => {
        // Process comments if they exist
        const enrichedComments = post.comments
          ? post.comments.map((comment) => ({
              id: comment.id,
              content: comment.content,
              created_at: comment.created_at,
              pubkey: comment.pubkey,
              author: authorProfiles[comment.pubkey] || {
                name: "Anonymous",
                picture: "",
              },
            }))
          : [];

        return {
          id: post.id,
          content: post.content,
          created_at: post.created_at,
          pubkey: post.pubkey,
          author: authorProfiles[post.pubkey] || {
            name: "Anonymous",
            picture: "",
          },
          comments: enrichedComments,
        };
      });

      if (isMounted) {
        setPostsWithAuthors(enrichedPosts);
        setIsLoadingProfiles(false);

        // Scroll to bottom after posts load
        setTimeout(() => {
          if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop =
              chatContainerRef.current.scrollHeight;
          }
        }, 100);
      }
    };

    loadAuthorProfiles();

    return () => {
      isMounted = false;
    };
  }, [posts, profile, getProfileByPubkey, publicKey]);

  const handleFollowAuthor = (pubkey: string) => {
    followUser(pubkey);
  };

  const handleUnfollowAuthor = (pubkey: string) => {
    unfollowUser(pubkey);
  };

  const toggleCommentForm = (postId: string) => {
    setExpandedCommentForms((prev) =>
      prev.includes(postId)
        ? prev.filter((id) => id !== postId)
        : [...prev, postId]
    );
  };

  const timeColor = useColorModeValue("gray.500", "gray.400");
  const hoverBg = useColorModeValue("gray.50", "darkBg.200"); // Very subtle hover color

  // Function to format timestamp in a more readable way
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) {
      return "just now";
    } else if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <Flex
      direction='column'
      h='calc(100vh - 60px)'
      maxW='container.xl'
      mx='auto'
      position='relative'
    >
      <Box>
        <Heading as='h1' size='xl' color='accent' textAlign='center' py={4}>
          Feed
        </Heading>
      </Box>

      {/* Main content area */}
      <Flex flex='1' px={4}>
        {/* Chat area - full width */}
        <Flex
          ref={chatContainerRef}
          direction='column'
          flex='1'
          overflowY='auto'
          pb={4}
          borderRadius='none'
        >
          {/* Loading indicator */}
          {isLoadingProfiles && (
            <Flex justify='center' py={4}>
              <Spinner color='accent' />
              <Text ml={3}>Loading posts...</Text>
            </Flex>
          )}

          {/* Empty state message */}
          {!isLoadingProfiles &&
            postsWithAuthors.length === 0 &&
            !isInitialLoad && (
              <Box p={6} borderRadius='none' textAlign='center' my='auto'>
                <Text color='gray.500'>
                  No posts yet. Follow some users or create your first post!
                </Text>
              </Box>
            )}

          {/* Posts list */}
          <VStack spacing={4} align='stretch' mt={4}>
            {/* Sort posts by timestamp (oldest first, newest at bottom) */}
            {[...postsWithAuthors]
              .sort((a, b) => a.created_at - b.created_at)
              .map((post) => (
                <Box
                  key={post.id}
                  py={3}
                  px={4}
                  _hover={{ bg: hoverBg }}
                  transition='background 0.2s'
                >
                  {/* Post header */}
                  <Flex mb={3} align='center'>
                    <Avatar
                      size='xs'
                      src={post.author.picture || undefined}
                      name={post.author.name}
                      mr={2}
                    />
                    <Box>
                      <Flex align='center'>
                        <Text fontWeight='bold' fontSize='sm'>
                          {post.author.name}
                        </Text>
                        {post.pubkey !== publicKey && (
                          <Button
                            size='xs'
                            ml={2}
                            colorScheme={
                              isFollowing(post.pubkey) ? "red" : "teal"
                            }
                            variant={
                              isFollowing(post.pubkey) ? "outline" : "solid"
                            }
                            onClick={() =>
                              isFollowing(post.pubkey)
                                ? handleUnfollowAuthor(post.pubkey)
                                : handleFollowAuthor(post.pubkey)
                            }
                          >
                            {isFollowing(post.pubkey) ? "Unfollow" : "Follow"}
                          </Button>
                        )}
                      </Flex>
                      <Text fontSize='xs' color={timeColor}>
                        {formatTimestamp(post.created_at)}
                      </Text>
                    </Box>
                  </Flex>

                  {/* Post content */}
                  <Text mb={3} fontSize='md'>
                    {post.content}
                  </Text>

                  {/* Comment button */}
                  <Flex justify='flex-start' mb={2}>
                    <Button
                      size='sm'
                      variant='ghost'
                      leftIcon={<ChatIcon />}
                      onClick={() => toggleCommentForm(post.id)}
                      color='gray.500'
                      _hover={{ color: "accent" }}
                    >
                      {expandedCommentForms.includes(post.id)
                        ? "Hide Reply"
                        : "Reply"}
                    </Button>
                  </Flex>

                  {/* Comments */}
                  {post.comments && post.comments.length > 0 && (
                    <Box
                      pl={4}
                      mt={2}
                      borderLeftWidth='2px'
                      borderColor='accent'
                      ml={2}
                    >
                      <VStack spacing={2} align='stretch'>
                        {post.comments.map((comment) => (
                          <Box key={comment.id} pt={2}>
                            <Flex align='flex-start'>
                              <Avatar
                                size='2xs'
                                src={comment.author.picture || undefined}
                                name={comment.author.name}
                                mr={2}
                              />
                              <Box flex='1'>
                                <Flex align='baseline' mb={1}>
                                  <Text fontWeight='medium' fontSize='xs'>
                                    {comment.author.name}
                                  </Text>
                                  <Text fontSize='xs' color={timeColor} ml={2}>
                                    {formatTimestamp(comment.created_at)}
                                  </Text>
                                </Flex>
                                <Text fontSize='sm'>{comment.content}</Text>
                              </Box>
                            </Flex>
                          </Box>
                        ))}
                      </VStack>
                    </Box>
                  )}

                  {/* Comment form */}
                  {expandedCommentForms.includes(post.id) && (
                    <Box mt={3} pl={4}>
                      <CommentNote
                        parentId={post.id}
                        onCommentAdded={() => {
                          // Keep the form open after comment is added
                        }}
                      />
                    </Box>
                  )}
                </Box>
              ))}
          </VStack>
        </Flex>
      </Flex>

      {/* Fixed input at bottom */}
      <Box
        py={3}
        px={4}
        bg='transparent'
        borderTopWidth='0'
        mt={4}
        borderRadius='none'
        position='sticky'
        bottom='0'
        width='100%'
        zIndex='1'
      >
        <PostNote />
      </Box>
    </Flex>
  );
};
