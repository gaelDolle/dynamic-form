"use client";
import {
  Box,
  Button,
  Card,
  Checkbox,
  Container,
  Field,
  Flex,
  Heading,
  Input,
  Select,
  Textarea,
  VStack,
  Text,
  createListCollection,
} from "@chakra-ui/react";
import { ChangeEvent, useEffect, useState } from "react";
import { FieldType, FormType } from "./page";

interface FormGeneratorProps {
  initialData?: FormType | null;
}

interface HistoryEntry {
  prompt: string;
  timestamp: Date;
}

const FormGenerator = ({ initialData }: FormGeneratorProps) => {
  const [prompt, setPrompt] = useState("");
  const [loadingAI, setLoadingAI] = useState(false);
  const [fields, setFields] = useState<FieldType[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    if (initialData?.fields) {
      setFields(initialData.fields);
    }
  }, [initialData]);

  const generateFromAI = async () => {
    if (!prompt.trim()) return;

    setLoadingAI(true);
    try {
      const res = await fetch("/api/forms/prompt", {
        method: "POST",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          prompt,
          currentFields: fields
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result = await res.json();

      if (result.fields && Array.isArray(result.fields)) {
        // Ensure initial fields (field_1, field_2, field_3) are always present
        const INITIAL_FIELD_IDS = ["field_1", "field_2", "field_3"];
        const initialFields = fields.filter((f: FieldType) => INITIAL_FIELD_IDS.includes(f.id));
        const newFields = result.fields.filter((f: FieldType) => !INITIAL_FIELD_IDS.includes(f.id));
        
        setFields([...initialFields, ...newFields]);
        setHistory(prev => [...prev, { prompt, timestamp: new Date() }]);
        setPrompt("");
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
    <Box w="100%" h="100vh" bg="gray.100">
      <Container fluid py={32} px={16} maxW="7xl">
        <Flex h="80vh" p={4} gap={4}>
          {/* AI Prompt input */}
          <Card.Root flex="1" bg="white" p={4} borderRadius="md" shadow="md">
            <Card.Body>
              <Heading size="md" mb={3}>
                AI Prompt
              </Heading>
              <Textarea
                value={prompt}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                  setPrompt(e.target.value)
                }
                placeholder="Décris le formulaire souhaité..."
                h="60%"
                borderColor="gray.200"
              />
              <Button
                mt={3}
                colorPalette="blue"
                onClick={generateFromAI}
                loading={loadingAI}
                size="sm"
              >
                Générer
              </Button>

              {/* History */}
              <Box mt={4}>
                <Heading size="sm" mb={2}>
                  Historique
                </Heading>
                <VStack align="stretch" gap={2} maxH="200px" overflowY="auto">
                  {history.length === 0 ? (
                    <Text fontSize="sm" color="gray.500">
                      Aucun historique
                    </Text>
                  ) : (
                    history.map((entry, idx) => (
                      <Box key={idx} p={2} bg="gray.50" borderRadius="md">
                        <Text fontSize="sm">{entry.prompt}</Text>
                        <Text fontSize="xs" color="gray.500">
                          {entry.timestamp.toLocaleTimeString()}
                        </Text>
                      </Box>
                    ))
                  )}
                </VStack>
              </Box>
            </Card.Body>
          </Card.Root>

          {/* Form preview */}
          <Card.Root flex="1" bg="white" p={4} borderRadius="md" shadow="md">
            <Card.Body>
              <Heading size="md" mb={3}>
                Preview
              </Heading>
              <VStack gap={4} align="stretch">
                {fields.map((field: FieldType) => (
                  <Field.Root key={field.id} required={field.required}>
                    <Field.Label>
                      {field.label}
                      {field.required && <Field.RequiredIndicator />}
                    </Field.Label>
                    {field.type === "textarea" ? (
                      <Textarea placeholder={field.placeholder} />
                    ) : field.type === "select" ? (
                      <Select.Root
                        collection={createListCollection({
                          items: field.options,
                        })}
                      >
                        <Select.HiddenSelect />
                        <Select.Label />
                        <Select.Control>
                          <Select.Trigger>
                            <Select.ValueText placeholder={field.placeholder} />
                          </Select.Trigger>
                          <Select.IndicatorGroup>
                            <Select.Indicator />
                            <Select.ClearTrigger />
                          </Select.IndicatorGroup>
                        </Select.Control>
                        <Select.Positioner>
                          <Select.Content>
                            {field.options.map((option) => (
                              <Select.Item key={option} item={option}>
                                {option}
                              </Select.Item>
                            ))}
                          </Select.Content>
                        </Select.Positioner>
                      </Select.Root>
                    ) : field.type === "checkbox" ? (
                      <Checkbox.Root>
                        <Checkbox.Control />
                        <Checkbox.Label>{field.label}</Checkbox.Label>
                      </Checkbox.Root>
                    ) : (
                      <Input
                        type={field.type}
                        placeholder={field.placeholder}
                      />
                    )}
                  </Field.Root>
                ))}
                {!!fields?.length && (
                  <Button colorPalette="green" variant="solid" size="sm">
                    Submit
                  </Button>
                )}
              </VStack>
            </Card.Body>
          </Card.Root>
        </Flex>
      </Container>
    </Box>
  );
};

export default FormGenerator;
