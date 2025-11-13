import { Center, Spinner } from "@chakra-ui/react";

export default function Loading() {
  return (
    <Center w="100%" minH="100vh">
      <Spinner size="sm" color="blue.solid" />
    </Center>
  );
}
