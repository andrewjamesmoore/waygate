import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { KeyManagement } from "../components/KeyManagement";
import { useNostr } from "../context/NostrContext";
import {
  Box,
  Heading,
  Text,
  VStack,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Button,
  Flex,
  useDisclosure,
} from "@chakra-ui/react";

export const LoginPage = () => {
  const { privateKey } = useNostr();
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure({ defaultIsOpen: true });

  useEffect(() => {
    if (privateKey) {
      navigate("/feed");
    }
  }, [privateKey, navigate]);

  return (
    <Box
      position='relative'
      height='100vh'
      width='100%'
      overflow='hidden'
      _before={{
        content: '""',
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundImage: "url('/assets/background.webp')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        zIndex: -1,
      }}
    >
      <Flex
        height='100%'
        width='100%'
        justifyContent='center'
        alignItems='center'
        direction='column'
      >
        <Heading
          as='h1'
          size='2xl'
          color='white'
          textShadow='0 0 10px rgba(0, 255, 255, 0.7)'
          mb={6}
        >
          Waygate Social
        </Heading>

        {!privateKey && (
          <Button
            onClick={onOpen}
            colorScheme='teal'
            size='lg'
            _hover={{ bg: "teal.500", transform: "translateY(-2px)" }}
            _active={{ bg: "teal.600" }}
            transition='all 0.2s'
          >
            Get Started
          </Button>
        )}

        <Modal isOpen={isOpen && !privateKey} onClose={onClose} isCentered>
          <ModalOverlay backdropFilter='blur(10px)' />
          <ModalContent
            bg='rgba(26, 32, 44, 0.8)'
            borderRadius='lg'
            border='1px solid rgba(255, 255, 255, 0.1)'
            p={4}
            maxW='md'
          >
            <ModalHeader color='white' textAlign='center'>
              Welcome to Nostr Social
            </ModalHeader>
            <ModalCloseButton color='white' />
            <ModalBody pb={6}>
              <VStack spacing={6} align='center' textAlign='center'>
                <Text fontSize='md' color='gray.300'>
                  Get started by generating a new key or importing an existing
                  one.
                </Text>
                <Box w='100%' mt={2}>
                  <KeyManagement />
                </Box>
              </VStack>
            </ModalBody>
          </ModalContent>
        </Modal>
      </Flex>
    </Box>
  );
};
