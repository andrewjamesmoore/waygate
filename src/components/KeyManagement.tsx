import { useState } from "react";
import { useNostr } from "../context/NostrContext";
import {
  Box,
  Button,
  Code,
  Flex,
  Heading,
  Input,
  Text,
  VStack,
  HStack,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useColorModeValue,
} from "@chakra-ui/react";
import { CopyIcon, ViewIcon, ViewOffIcon } from "@chakra-ui/icons";

export const KeyManagement = () => {
  const { privateKey, npub, generateNewKey, setPrivateKey } = useNostr();
  const [inputKey, setInputKey] = useState("");
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const toast = useToast();

  const bgColor = useColorModeValue("gray.50", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const codeBg = useColorModeValue("gray.100", "gray.800");

  const handleImportKey = () => {
    if (inputKey.trim()) {
      setPrivateKey(inputKey.trim());
      setInputKey("");
    }
  };

  const handleCopy = async (text: string, type: string) => {
    await navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${type} copied to clipboard`,
      status: "success",
      duration: 2000,
      isClosable: true,
      position: "bottom",
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
        Key Management
      </Heading>

      {privateKey ? (
        <VStack spacing={4} align='stretch'>
          <Box>
            <Text mb={2} fontWeight='medium'>
              Your public key (npub):
            </Text>
            <Flex
              bg={codeBg}
              p={2}
              borderRadius='md'
              alignItems='center'
              borderWidth='1px'
              borderColor={borderColor}
            >
              <Code
                flex='1'
                bg='transparent'
                fontSize='sm'
                wordBreak='break-all'
                p={2}
              >
                {npub}
              </Code>
              <Button
                size='sm'
                leftIcon={<CopyIcon />}
                onClick={() => handleCopy(npub || "", "Public key")}
                ml={2}
                colorScheme='blue'
                variant='ghost'
              >
                Copy
              </Button>
            </Flex>
          </Box>

          <Box>
            <Text mb={2} fontWeight='medium'>
              Your private key (nsec):
            </Text>
            <Flex
              bg={codeBg}
              p={2}
              borderRadius='md'
              alignItems='center'
              borderWidth='1px'
              borderColor={borderColor}
            >
              <Code
                flex='1'
                bg='transparent'
                fontSize='sm'
                wordBreak='break-all'
                p={2}
              >
                {showPrivateKey
                  ? privateKey
                  : "••••••••••••••••••••••••••••••••"}
              </Code>
              <HStack spacing={2}>
                <Button
                  size='sm'
                  leftIcon={showPrivateKey ? <ViewOffIcon /> : <ViewIcon />}
                  onClick={() => setShowPrivateKey(!showPrivateKey)}
                  colorScheme='blue'
                  variant='ghost'
                >
                  {showPrivateKey ? "Hide" : "Show"}
                </Button>
                <Button
                  size='sm'
                  leftIcon={<CopyIcon />}
                  onClick={() => handleCopy(privateKey, "Private key")}
                  colorScheme='blue'
                  variant='ghost'
                >
                  Copy
                </Button>
              </HStack>
            </Flex>
          </Box>

          <Alert status='warning' borderRadius='md'>
            <AlertIcon />
            <Box>
              <AlertTitle>Save your private key!</AlertTitle>
              <AlertDescription>
                You'll need it to sign back in. Never share it with anyone!
              </AlertDescription>
            </Box>
          </Alert>
        </VStack>
      ) : (
        <VStack spacing={6} align='stretch'>
          <Text color='gray.500'>
            Get started by generating a new key or importing an existing one.
          </Text>

          <Button
            onClick={generateNewKey}
            colorScheme='brand'
            size='lg'
            height='50px'
            borderRadius='md'
          >
            Generate New Key
          </Button>

          <Box>
            <Text mb={2} fontWeight='medium'>
              Import Existing Key
            </Text>
            <Flex>
              <Input
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                placeholder='Enter private key (hex format)'
                borderRadius='md'
                borderRightRadius='0'
                bg={codeBg}
                _focus={{
                  borderColor: "brand.500",
                  boxShadow: "0 0 0 1px var(--chakra-colors-brand-500)",
                }}
              />
              <Button
                onClick={handleImportKey}
                colorScheme='brand'
                borderLeftRadius='0'
                px={6}
              >
                Import
              </Button>
            </Flex>
          </Box>
        </VStack>
      )}
    </Box>
  );
};
