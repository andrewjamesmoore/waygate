import { useState, useEffect, useRef } from "react";
import { useNostr } from "../context/NostrContext";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  VStack,
  Heading,
  Text,
  Avatar,
  Center,
  useToast,
  useColorModeValue,
  Flex,
  Icon,
} from "@chakra-ui/react";
import { AddIcon } from "@chakra-ui/icons";

export const Profile = () => {
  const { profile, updateProfile, privateKey } = useNostr();
  const [name, setName] = useState(profile.name);
  const [about, setAbout] = useState(profile.about);
  const [avatar, setAvatar] = useState(profile.avatar);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const bgColor = useColorModeValue("gray.50", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const inputBg = useColorModeValue("white", "gray.800");

  useEffect(() => {
    setName(profile.name);
    setAbout(profile.about);
    setAvatar(profile.avatar);
  }, [profile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile(name, about, avatar);
    toast({
      title: "Profile updated",
      description: "Your profile has been updated successfully!",
      status: "success",
      duration: 3000,
      isClosable: true,
      position: "bottom",
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (limit to 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image under 2MB.",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "bottom",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setAvatar(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  if (!privateKey) {
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
          Profile
        </Heading>
        <Text>Please add a key to manage your profile.</Text>
      </Box>
    );
  }

  return (
    <Box
      bg={bgColor}
      borderRadius='lg'
      borderWidth='1px'
      borderColor={borderColor}
      p={6}
      shadow='md'
    >
      <Heading size='md' mb={6} color='brand.500'>
        User Profile
      </Heading>

      <form onSubmit={handleSubmit}>
        <VStack spacing={6} align='stretch'>
          <Center flexDirection='column'>
            <Box
              position='relative'
              cursor='pointer'
              onClick={handleAvatarClick}
              mb={2}
            >
              <Avatar
                size='2xl'
                src={avatar || undefined}
                name={name || "User"}
                bg='brand.500'
                border='4px solid'
                borderColor='brand.200'
              />
              <Flex
                position='absolute'
                bottom='0'
                right='0'
                bg='brand.500'
                color='white'
                borderRadius='full'
                w='32px'
                h='32px'
                align='center'
                justify='center'
                border='2px solid'
                borderColor={bgColor}
              >
                <Icon as={AddIcon} />
              </Flex>
            </Box>
            <Text fontSize='sm' color='gray.500' mb={4}>
              Click to upload a profile picture
            </Text>
          </Center>

          <Input
            type='file'
            ref={fileInputRef}
            onChange={handleFileChange}
            accept='image/*'
            display='none'
          />

          <FormControl>
            <FormLabel htmlFor='name' fontWeight='medium'>
              Display Name
            </FormLabel>
            <Input
              id='name'
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='Your display name'
              bg={inputBg}
              borderColor={borderColor}
              _focus={{
                borderColor: "brand.500",
                boxShadow: "0 0 0 1px var(--chakra-colors-brand-500)",
              }}
            />
          </FormControl>

          <FormControl>
            <FormLabel htmlFor='about' fontWeight='medium'>
              About Me
            </FormLabel>
            <Textarea
              id='about'
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              placeholder='Tell us about yourself'
              rows={4}
              bg={inputBg}
              borderColor={borderColor}
              _focus={{
                borderColor: "brand.500",
                boxShadow: "0 0 0 1px var(--chakra-colors-brand-500)",
              }}
            />
          </FormControl>

          <Button
            type='submit'
            colorScheme='brand'
            size='lg'
            height='50px'
            mt={4}
          >
            Save Changes
          </Button>
        </VStack>
      </form>
    </Box>
  );
};
