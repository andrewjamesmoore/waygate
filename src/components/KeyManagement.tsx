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
} from "@chakra-ui/react";
import { CopyIcon, ViewIcon, ViewOffIcon } from "@chakra-ui/icons";

export const KeyManagement = () => {
  const { privateKey, npub, generateNewKey, setPrivateKey } = useNostr();
  const [inputKey, setInputKey] = useState("");
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const toast = useToast();

  // Using darker colors for the modal theme
  const bgColor = "transparent";
  const borderColor = "transparent";
  const codeBg = "rgba(0, 0, 0, 0.3)";

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
    >
      <Heading size='md' mb={4} color='teal.300'>
        Key Management
      </Heading>

      {privateKey ? (
        <VStack spacing={4} align='stretch'>
          <Box>
            <Text mb={2} fontWeight='medium' color='white'>
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
            <Text mb={2} fontWeight='medium' color='white'>
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
          <Text color='gray.300'>
            Get started by generating a new key or importing an existing one.
          </Text>

          <Button
            onClick={generateNewKey}
            colorScheme='teal'
            size='lg'
            height='50px'
            borderRadius='md'
            _hover={{ bg: "teal.500", transform: "translateY(-2px)" }}
            _active={{ bg: "teal.600" }}
            transition='all 0.2s'
          >
            Generate New Key
          </Button>

          <Box>
            <Text mb={2} fontWeight='medium' color='white'>
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
                colorScheme='teal'
                borderLeftRadius='0'
                px={6}
                _hover={{ bg: "teal.500" }}
                _active={{ bg: "teal.600" }}
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
