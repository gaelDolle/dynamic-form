"use client";
import {
  Box,
  Button,
  Checkbox,
  Flex,
  FormLabel,
  Heading,
  Input,
  Select,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { useState } from "react";

interface Field {
  id: string;
  type: string;
  label: string;
  name: string;
  placeholder: string;
  required: boolean;
  options: string[];
}

const FormGenerator = () => {
  const [prompt, setPrompt] = useState("");
  const [loadingAI, setLoadingAI] = useState(false);
  const [fields, setFields] = useState<Field[]>([]);

  const generateFromAI = async () => {
    if (!prompt.trim()) return;

    setLoadingAI(true);
    try {
      const baseUrl =
        typeof window !== "undefined" ? window.location.origin : "";
      const res = await fetch(`${baseUrl}/api/prompt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result = await res.json();

      // Traiter le résultat ici
      if (result.fields && Array.isArray(result.fields)) {
        setFields(result.fields);
      } else {
        console.log(result);
      }
    } catch (err) {
      const error =
        err instanceof Error ? err.message : "Une erreur est survenue";
      console.error(error);
    } finally {
      setLoadingAI(false);
    }
  };

  return (
    <Flex h="100vh" p={4} gap={4} bg="gray.50">
      {/* AI Prompt input */}
      <Box flex="1" bg="white" p={4} borderRadius="md" shadow="md">
        <Heading size="md" mb={3}>
          AI Prompt
        </Heading>
        <Textarea
          value={prompt}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setPrompt(e.target.value)
          }
          placeholder="Décris le formulaire souhaité..."
          h="80%"
        />
        <Button
          mt={3}
          colorScheme="blue"
          onClick={generateFromAI}
          isLoading={loadingAI}
        >
          Générer
        </Button>
      </Box>

      {/* Form preview */}
      <Box
        flex="1"
        bg="white"
        p={4}
        borderRadius="md"
        shadow="md"
        overflowY="auto"
      >
        <Heading size="md" mb={3}>
          Preview
        </Heading>
        <VStack spacing={4} align="stretch">
          {fields.map((f: Field) => (
            <Box key={f.id}>
              <FormLabel>
                {f.label}
                {f.required ? " *" : ""}
              </FormLabel>
              {f.type === "textarea" ? (
                <Textarea placeholder={f.placeholder} />
              ) : f.type === "select" ? (
                <Select>
                  {f.options.map((o: string, i: number) => (
                    <option key={i}>{o}</option>
                  ))}
                </Select>
              ) : f.type === "checkbox" ? (
                <Checkbox>{f.label}</Checkbox>
              ) : (
                <Input type={f.type} placeholder={f.placeholder} />
              )}
            </Box>
          ))}
          {fields.length > 0 && <Button colorScheme="green">Submit</Button>}
        </VStack>
      </Box>
    </Flex>
  );
};

export default FormGenerator;
