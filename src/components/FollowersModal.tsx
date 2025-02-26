import { useState, useEffect } from "react";
import { useNostr } from "../context/NostrContext";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  VStack,
  Flex,
  Text,
  Avatar,
  Spinner,
  useColorModeValue,
  Divider,
} from "@chakra-ui/react";
import { FollowUser } from "./FollowUser";

interface FollowersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FollowersModal = ({ isOpen, onClose }: FollowersModalProps) => {
  const { following, getProfileByPubkey, unfollowUser } = useNostr();
  const [followingProfiles, setFollowingProfiles] = useState<
    Array<{
      pubkey: string;
      name: string;
      picture: string;
    }>
  >([]);
  const [isLoading, setIsLoading] = useState(false);

  const hoverBg = useColorModeValue("gray.50", "#2A2A2A");

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

    if (isOpen) {
      loadFollowingProfiles();
    }
  }, [following, getProfileByPubkey, isOpen]);

  const handleUnfollow = (pubkey: string) => {
    unfollowUser(pubkey);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size='md'>
      <ModalOverlay bg='blackAlpha.300' backdropFilter='blur(10px)' />
      <ModalContent bg={useColorModeValue("white", "#1E1E1E")}>
        <ModalHeader>Following ({following.length})</ModalHeader>
        <ModalCloseButton />
        <Divider />
        <ModalBody>
          <FollowUser />

          <Divider my={4} />

          {isLoading ? (
            <Flex justify='center' py={4}>
              <Spinner color='gray.400' />
              <Text ml={3}>Loading following profiles...</Text>
            </Flex>
          ) : followingProfiles.length > 0 ? (
            <VStack
              spacing={3}
              align='stretch'
              maxH='60vh'
              overflowY='auto'
              pr={2}
            >
              {followingProfiles.map((profile) => (
                <Flex
                  key={profile.pubkey}
                  p={2}
                  borderRadius='md'
                  align='center'
                  _hover={{ bg: hoverBg }}
                  transition='background 0.2s'
                >
                  <Avatar
                    size='xs'
                    src={profile.picture || undefined}
                    name={profile.name}
                    mr={2}
                  />
                  <Text flex='1' fontSize='sm' fontWeight='medium'>
                    {profile.name}
                  </Text>
                  <Button
                    size='xs'
                    colorScheme='red'
                    variant='outline'
                    onClick={() => handleUnfollow(profile.pubkey)}
                  >
                    Unfollow
                  </Button>
                </Flex>
              ))}
            </VStack>
          ) : (
            <Text color='gray.500' textAlign='center' py={4} fontSize='sm'>
              You are not following anyone yet.
            </Text>
          )}
        </ModalBody>

        <ModalFooter>
          <Button variant='ghost' onClick={onClose}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
