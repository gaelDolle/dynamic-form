import { Box, Container } from "@chakra-ui/react";
import FormGenerator from "./form-generator";

export default function Home() {
  return (
    <Box minH="100vh" bg="gray.50">
      <Container fluid maxW="100%" minH="100vh" py={32} px={16}>
        <FormGenerator />
      </Container>
    </Box>
  );
}
