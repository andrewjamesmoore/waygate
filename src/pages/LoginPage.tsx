import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { KeyManagement } from "../components/KeyManagement";
import { useNostr } from "../context/NostrContext";
import { Box, Heading, Text, Container, VStack } from "@chakra-ui/react";

export const LoginPage = () => {
  const { privateKey } = useNostr();
  const navigate = useNavigate();

  useEffect(() => {
    if (privateKey) {
      navigate("/feed");
    }
  }, [privateKey, navigate]);

  return (
    <Container maxW='container.md' py={10}>
      <VStack spacing={6} align='center' textAlign='center'>
        <Heading as='h1' size='xl' color='brand.500'>
          Welcome to Nostr Social
        </Heading>
        <Text fontSize='lg' color='gray.500'>
          Get started by generating a new key or importing an existing one.
        </Text>
        <Box w='100%' mt={4}>
          <KeyManagement />
        </Box>
      </VStack>
    </Container>
  );
};
