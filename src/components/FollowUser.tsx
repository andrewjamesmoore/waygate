import { useState } from "react";
import { useNostr } from "../context/NostrContext";
import { nip19 } from "nostr-tools";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Flex,
  Heading,
  Text,
  Avatar,
  VStack,
  useToast,
  useColorModeValue,
  InputGroup,
  InputRightElement,
} from "@chakra-ui/react";
import { SearchIcon } from "@chakra-ui/icons";

export const FollowUser = () => {
  const { followUser, unfollowUser, isFollowing, getProfileByPubkey } =
    useNostr();
  const [npubInput, setNpubInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<{
    pubkey: string;
    name: string;
    about: string;
    picture: string;
  } | null>(null);
  const toast = useToast();

  const bgColor = useColorModeValue("gray.50", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const inputBg = useColorModeValue("white", "gray.800");
  const cardBg = useColorModeValue("white", "gray.800");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!npubInput.trim()) {
      toast({
        title: "Input required",
        description: "Please enter an npub",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);

    try {
      // Check if input is a valid npub
      if (!npubInput.startsWith("npub1")) {
        toast({
          title: "Invalid format",
          description: "Invalid npub format. Must start with 'npub1'",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        setSearchResult(null);
        setIsLoading(false);
        return;
      }

      // Decode the npub to get the pubkey
      const { data: pubkey } = nip19.decode(npubInput);

      // Get profile data
      const profile = await getProfileByPubkey(pubkey as string);

      if (profile) {
        setSearchResult({
          pubkey: pubkey as string,
          name: profile.name,
          about: profile.about,
          picture: profile.picture,
        });
      } else {
        setSearchResult(null);
        toast({
          title: "Not found",
          description: "No profile found for this npub",
          status: "info",
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error("Failed to search for user:", error);
      setSearchResult(null);
      toast({
        title: "Error",
        description: "Invalid npub or network error",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollow = () => {
    if (!searchResult) return;

    followUser(searchResult.pubkey);
    toast({
      title: "Success",
      description: "User followed successfully!",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };

  const handleUnfollow = () => {
    if (!searchResult) return;

    unfollowUser(searchResult.pubkey);
    toast({
      title: "Success",
      description: "User unfollowed",
      status: "info",
      duration: 3000,
      isClosable: true,
    });
  };

  return (
    <Box
      bg={bgColor}
      borderRadius='lg'
      borderWidth='1px'
      borderColor={borderColor}
      p={6}
      shadow='md'
    >
      <Heading size='md' mb={4} color='brand.500'>
        Follow User
      </Heading>

      <form onSubmit={handleSearch}>
        <FormControl mb={6}>
          <FormLabel htmlFor='npub' fontWeight='medium'>
            Enter Nostr Public Key (npub):
          </FormLabel>
          <InputGroup size='md'>
            <Input
              id='npub'
              value={npubInput}
              onChange={(e) => setNpubInput(e.target.value)}
              placeholder='npub1...'
              isDisabled={isLoading}
              bg={inputBg}
              borderColor={borderColor}
              _focus={{
                borderColor: "brand.500",
                boxShadow: "0 0 0 1px var(--chakra-colors-brand-500)",
              }}
              pr='4.5rem'
            />
            <InputRightElement width='4.5rem'>
              <Button
                h='1.75rem'
                size='sm'
                type='submit'
                isLoading={isLoading}
                colorScheme='brand'
                leftIcon={<SearchIcon />}
                isDisabled={!npubInput.trim()}
              >
                {isLoading ? "..." : "Search"}
              </Button>
            </InputRightElement>
          </InputGroup>
        </FormControl>
      </form>

      {searchResult && (
        <Box
          bg={cardBg}
          borderRadius='md'
          borderWidth='1px'
          borderColor={borderColor}
          p={4}
          mt={4}
        >
          <Flex mb={4}>
            <Avatar
              size='lg'
              src={searchResult.picture || undefined}
              name={searchResult.name || "Anonymous"}
              mr={4}
            />
            <VStack align='start' spacing={1} flex='1'>
              <Heading size='md'>{searchResult.name || "Anonymous"}</Heading>
              <Text fontSize='sm' color='gray.500' wordBreak='break-all'>
                {npubInput}
              </Text>
            </VStack>
          </Flex>

          {searchResult.about && (
            <Text fontSize='sm' mb={4} color='gray.600'>
              {searchResult.about}
            </Text>
          )}

          <Flex justify='flex-end'>
            {isFollowing(searchResult.pubkey) ? (
              <Button
                onClick={handleUnfollow}
                colorScheme='red'
                size='md'
                variant='outline'
              >
                Unfollow
              </Button>
            ) : (
              <Button onClick={handleFollow} colorScheme='brand' size='md'>
                Follow
              </Button>
            )}
          </Flex>
        </Box>
      )}
    </Box>
  );
};
