import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Profile } from "../components/Profile";
import { KeyManagement } from "../components/KeyManagement";
import { FollowUser } from "../components/FollowUser";
import { useNostr } from "../context/NostrContext";
import {
  Box,
  Container,
  VStack,
  Heading,
  Text,
  Avatar,
  Button,
  Flex,
  Divider,
  Spinner,
  useColorModeValue,
  SimpleGrid,
} from "@chakra-ui/react";

export const SettingsPage = () => {
  const { privateKey, following, getProfileByPubkey, unfollowUser } =
    useNostr();
  const navigate = useNavigate();
  const [followingProfiles, setFollowingProfiles] = useState<
    Array<{
      pubkey: string;
      name: string;
      picture: string;
    }>
  >([]);
  const [isLoading, setIsLoading] = useState(false);

  const bgColor = useColorModeValue("gray.50", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const itemBg = useColorModeValue("white", "gray.800");
  const itemHoverBg = useColorModeValue("gray.50", "gray.700");

  useEffect(() => {
    if (!privateKey) {
      navigate("/login");
    }
  }, [privateKey, navigate]);

  // Load following profiles
  useEffect(() => {
    const loadFollowingProfiles = async () => {
      if (following.length === 0) return;

      setIsLoading(true);
      const profiles = [];

      for (const pubkey of following) {
        try {
          const profile = await getProfileByPubkey(pubkey);
          if (profile) {
            profiles.push({
              pubkey,
              name: profile.name || "Anonymous",
              picture: profile.picture || "",
            });
          }
        } catch (error) {
          console.error(`Failed to load profile for ${pubkey}:`, error);
        }
      }

      setFollowingProfiles(profiles);
      setIsLoading(false);
    };

    loadFollowingProfiles();
  }, [following, getProfileByPubkey]);

  return (
    <Container maxW='container.lg' py={8}>
      <VStack spacing={8} align='stretch'>
        <Heading as='h1' size='xl' color='brand.500' mb={6}>
          Account Settings
        </Heading>

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
          <Box>
            <Profile />
          </Box>
          <Box>
            <KeyManagement />
          </Box>
        </SimpleGrid>

        <Box>
          <FollowUser />
        </Box>

        <Box
          bg={bgColor}
          borderRadius='lg'
          borderWidth='1px'
          borderColor={borderColor}
          p={6}
          shadow='md'
        >
          <Heading size='md' mb={4} color='brand.500'>
            Following ({following.length})
          </Heading>
          <Divider mb={4} />

          {isLoading ? (
            <Flex justify='center' py={4}>
              <Spinner color='brand.500' />
              <Text ml={3}>Loading following profiles...</Text>
            </Flex>
          ) : followingProfiles.length > 0 ? (
            <VStack spacing={3} align='stretch'>
              {followingProfiles.map((profile) => (
                <Flex
                  key={profile.pubkey}
                  p={3}
                  borderRadius='md'
                  borderWidth='1px'
                  borderColor={borderColor}
                  align='center'
                  bg={itemBg}
                  _hover={{ bg: itemHoverBg }}
                >
                  <Avatar
                    size='sm'
                    src={profile.picture || undefined}
                    name={profile.name}
                    mr={3}
                  />
                  <Text flex='1' fontWeight='medium'>
                    {profile.name}
                  </Text>
                  <Button
                    size='sm'
                    colorScheme='red'
                    variant='outline'
                    onClick={() => unfollowUser(profile.pubkey)}
                  >
                    Unfollow
                  </Button>
                </Flex>
              ))}
            </VStack>
          ) : (
            <Text color='gray.500' textAlign='center' py={4}>
              You are not following anyone yet.
            </Text>
          )}
        </Box>
      </VStack>
    </Container>
  );
};
