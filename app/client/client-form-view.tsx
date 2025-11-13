"use client";
import FormField from "@/components/form-field";
import {
  Box,
  Button,
  GridItem,
  Heading,
  SimpleGrid,
  VStack,
} from "@chakra-ui/react";
import { useState } from "react";
import { FormType } from "../admin/page";

const ClientFormView = () => {
  const [form] = useState<FormType | null>(() => {
    const storedForm = localStorage.getItem("form");
    return storedForm ? (JSON.parse(storedForm) as FormType) : null;
  });

  if (!form) {
    return <Box>Chargement...</Box>;
  }
  return (
    <Box p={8}>
      <Heading mb={6}>Formulaire</Heading>
      <VStack gap={4} align="stretch">
        <SimpleGrid columns={{ base: 1, md: 2 }} gap={4} w="100%">
          {form.fields.map((field) => (
            <GridItem
              key={field.id}
              colSpan={field.type === "textarea" ? 2 : 1}
            >
              <FormField field={field} />
            </GridItem>
          ))}
        </SimpleGrid>
        {form.fields.length > 0 && (
          <Button colorPalette="blue" size="md" w="100%">
            Soumettre
          </Button>
        )}
      </VStack>
    </Box>
  );
};

export default ClientFormView;
