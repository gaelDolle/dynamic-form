"use client";
import {
  Box,
  Button,
  Card,
  Checkbox,
  Code,
  Container,
  Field,
  Flex,
  Heading,
  Input,
  Select,
  Textarea,
  VStack,
  createListCollection,
} from "@chakra-ui/react";
import { ChangeEvent, useEffect, useState } from "react";
import { FieldType, FormType } from "./page";

interface FormGeneratorProps {
  initialData?: FormType | null;
}

const FormGenerator = ({ initialData }: FormGeneratorProps) => {
  const [prompt, setPrompt] = useState("");
  const [loadingAI, setLoadingAI] = useState(false);
  const [result, setResult] = useState<{ response: string } | null>(null);
  const [fields, setFields] = useState<FieldType[]>([]);

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
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result = await res.json();
      setResult(result);

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
                h="80%"
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
            </Card.Body>
          </Card.Root>

          {/* Form preview */}
          <Card.Root flex="1" bg="white" p={4} borderRadius="md" shadow="md">
            <Card.Body>
              <Heading size="md" mb={3}>
                Preview
              </Heading>
              <VStack gap={4} align="stretch">
                {result?.response && <Code>{result.response}</Code>}

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
