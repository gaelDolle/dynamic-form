"use client";
import {
  Box,
  Button,
  Code,
  Flex,
  Heading,
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
  const [result, setResult] = useState<{ response: string } | null>(null);
  const [fields, setFields] = useState<Field[]>([]);

  const generateFromAI = async () => {
    if (!prompt.trim()) return;

    setLoadingAI(true);
    try {
      const baseUrl =
        typeof window !== "undefined" ? window.location.origin : "";
      const res = await fetch(`${baseUrl}/api/forms/prompt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result = await res.json();
      setResult(result);
      console.log("🚀 ~ generateFromAI ~ result:", result);

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
    <Flex h="80vh" p={4} gap={4} bg="gray.50">
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
          loading={loadingAI}
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
        <VStack gap={4} align="stretch">
          {result?.response && <Code>{result.response}</Code>}

          {/* {fields.map((f: Field) => (
            <Field.Root key>
              <FormLabel>
                {f.label}
                {f.required ? " *" : ""}
              </FormLabel>
              {f.type === "textarea" ? (
                <Textarea placeholder={f.placeholder} />
              ) : f.type === "select" ? (
              ) : f.type === "checkbox" ? (
              ) : (
                <Input type={f.type} placeholder={f.placeholder} />
              )}
            </Field.Root>
          ))} */}
          {fields.length > 0 && <Button colorScheme="green">Submit</Button>}
        </VStack>
      </Box>
    </Flex>
  );
};

export default FormGenerator;
