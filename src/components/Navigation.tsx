import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import { useNostr } from "../context/NostrContext";
import {
  Box,
  Flex,
  Text,
  Button,
  HStack,
  Avatar,
  Link,
  useColorModeValue,
  useColorMode,
  IconButton,
  Tooltip,
  useDisclosure,
} from "@chakra-ui/react";
import { MoonIcon, SunIcon } from "@chakra-ui/icons";
import { FollowersModal } from "./FollowersModal";
import { FaUsers } from "react-icons/fa";

export const Navigation = () => {
  const { privateKey, setPrivateKey, profile } = useNostr();
  const location = useLocation();
  const navigate = useNavigate();
  const { colorMode, toggleColorMode } = useColorMode();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const bgColor = useColorModeValue("white", "darkBg.100");
  const borderColor = useColorModeValue("gray.200", "darkBg.100");

  const handleLogout = () => {
    setPrivateKey("");
    navigate("/login");
  };

  if (!privateKey || location.pathname === "/login") {
    return null;
  }

  return (
    <Box
      as='nav'
      position='fixed'
      top='0'
      left='0'
      right='0'
      zIndex='100'
      bg={bgColor}
      borderBottom='1px solid'
      borderColor={borderColor}
      boxShadow='none'
      py={2}
      px={4}
    >
      <Flex justify='space-between' align='center' maxW='1200px' mx='auto'>
        <Link
          as={RouterLink}
          to='/feed'
          fontSize='xl'
          fontWeight='bold'
          color='accent'
          _hover={{ textDecoration: "none" }}
        >
          Nostr Social
        </Link>

        <HStack spacing={4}>
          <Tooltip
            label={
              colorMode === "dark"
                ? "Switch to Light Mode"
                : "Switch to Dark Mode"
            }
          >
            <IconButton
              aria-label='Toggle color mode'
              icon={colorMode === "dark" ? <SunIcon /> : <MoonIcon />}
              onClick={toggleColorMode}
              variant='ghost'
              size='md'
            />
          </Tooltip>

          <Tooltip label='Following'>
            <IconButton
              aria-label='View following'
              icon={<FaUsers />}
              onClick={onOpen}
              variant='ghost'
              size='md'
            />
          </Tooltip>
          <Link
            as={RouterLink}
            to='/feed'
            px={3}
            py={2}
            rounded='md'
            bg={location.pathname === "/feed" ? "brand.50" : "transparent"}
            color={location.pathname === "/feed" ? "brand.700" : "gray.600"}
            fontWeight={location.pathname === "/feed" ? "medium" : "normal"}
            _hover={{ bg: "brand.50" }}
          >
            Feed
          </Link>

          <Link
            as={RouterLink}
            to='/settings'
            px={3}
            py={2}
            rounded='md'
            bg={location.pathname === "/settings" ? "brand.50" : "transparent"}
            color={location.pathname === "/settings" ? "brand.700" : "gray.600"}
            fontWeight={location.pathname === "/settings" ? "medium" : "normal"}
            _hover={{ bg: "brand.50" }}
          >
            Settings
          </Link>

          <HStack spacing={2}>
            <Avatar
              size='sm'
              src={profile.avatar || undefined}
              name={profile.name || "User"}
            />
            {profile.name && (
              <Text fontWeight='medium' color='gray.700'>
                {profile.name}
              </Text>
            )}
          </HStack>

          <Button
            variant='outline'
            colorScheme='red'
            size='sm'
            onClick={handleLogout}
          >
            Logout
          </Button>
        </HStack>
      </Flex>

      {/* Followers Modal */}
      <FollowersModal isOpen={isOpen} onClose={onClose} />
    </Box>
  );
};
