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
  HStack,
  Heading,
  Icon,
  Input,
  Select,
  Textarea,
  VStack,
  createListCollection,
} from "@chakra-ui/react";
import { ChangeEvent, useEffect, useState } from "react";
import { LuSave } from "react-icons/lu";
import { RxMagicWand } from "react-icons/rx";
import { FieldType, FormType } from "./page";
import SelectMCC, { MCCOption, MCC_OPTIONS } from "./select-mcc";

interface FormGeneratorProps {
  initialData?: FormType | null;
}

const FormGenerator = ({ initialData }: FormGeneratorProps) => {
  const [prompt, setPrompt] = useState("");
  const [loadingAI, setLoadingAI] = useState(false);
  const [result, setResult] = useState<{ response: string } | null>(null);
  const [initialForm, setInitialForm] = useState<FormType | null>(null);
  const [mcc, setMcc] = useState<MCCOption | null>(null);
  const [form, setForm] = useState<FormType | null>(null);
  const [conversationHistory, setConversationHistory] = useState<
    Array<{ role: "user" | "assistant"; content: string }>
  >([]);

  useEffect(() => {
    if (initialData?.fields) {
      setInitialForm(initialData);
      setForm(initialData);
    }
  }, [initialData]);

  const generateFromAI = async () => {
    if (!prompt.trim()) return;

    setLoadingAI(true);
    const currentPrompt = prompt;
    setPrompt(""); // Clear input immediately

    try {
      const res = await fetch("/api/forms/prompt", {
        method: "POST",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: currentPrompt,
          history: conversationHistory,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result = await res.json();
      setResult(result);
      console.log("🚀 ~ generateFromAI ~ result:", result);

      // Mettre à jour l'historique de conversation
      const assistantResponse = JSON.stringify(result);
      setConversationHistory((prev) => [
        ...prev,
        { role: "user", content: currentPrompt },
        { role: "assistant", content: assistantResponse },
      ]);

      if (result.fields && Array.isArray(result.fields)) {
        const newForm = {
          ...initialForm,
          fields: [...(initialForm?.fields || []), ...result.fields],
        };
        setForm(newForm as FormType);
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

  useEffect(() => {
    console.log(
      "🚀 ~ FormGenerator ~ conversationHistory:",
      conversationHistory
    );
  }, [conversationHistory]);

  return (
    <Box w="100%" minH="100vh" bg="gray.100">
      <Container fluid py={32} px={16} maxW="7xl">
        <Flex minH="80vh" p={4} gap={4}>
          {/* AI Prompt input */}
          <Card.Root flex="1" bg="white" p={4} borderRadius="md" shadow="md">
            <Card.Body>
              <Heading size="sm">Votre MCC</Heading>
              <SelectMCC
                value={mcc || undefined}
                onChange={(value: string) => {
                  const option = MCC_OPTIONS.find((opt) => opt.value === value);
                  setMcc(option || null);
                }}
              />
              <Heading size="sm" mt={3} mb={2}>
                AI Prompt
              </Heading>

              <Textarea
                value={prompt}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                  setPrompt(e.target.value)
                }
                placeholder="Décris le formulaire souhaité..."
                h="50%"
                borderColor="gray.200"
              />
              <Button
                mt={3}
                colorPalette="blue"
                onClick={generateFromAI}
                loading={loadingAI}
                size="sm"
              >
                <Icon>
                  <RxMagicWand />
                </Icon>
                Générer
              </Button>
              <Box as="ul" listStyleType="circle" m={4}>
                {conversationHistory
                  ?.filter((item) => item.role === "user")
                  .map((item) => (
                    <li key={item.content}>{item.content}</li>
                  ))}
              </Box>
            </Card.Body>
          </Card.Root>

          {/* Form preview */}
          <Card.Root flex="1" bg="white" p={4} borderRadius="md" shadow="md">
            <Card.Body position="relative">
              <Heading size="md" mb={3}>
                Preview
              </Heading>
              <VStack gap={4} align="stretch">
                {result?.response && (
                  <Code>{JSON.stringify(result.response, null, 2)}</Code>
                )}

                {form?.fields.map((field: FieldType) => (
                  <Field.Root key={field.id} required={field.required}>
                    <Field.Label>
                      {field.label}
                      {field.required && <Field.RequiredIndicator />}
                    </Field.Label>
                    {field.type === "textarea" ? (
                      <Textarea placeholder={field.placeholder} />
                    ) : field.type === "select" && field.options.length > 0 ? (
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
                {!!form?.fields?.length && (
                  <Button colorPalette="gray" variant="surface" size="sm">
                    Submit
                  </Button>
                )}
              </VStack>
              <HStack
                justify="flex-end"
                gap={2}
                position="absolute"
                bottom={4}
                right={4}
              >
                <Button colorPalette="green" variant="surface" size="sm">
                  <Icon>
                    <LuSave />
                  </Icon>
                  Enregistrer
                </Button>
              </HStack>
            </Card.Body>
          </Card.Root>
        </Flex>
      </Container>
    </Box>
  );
};

export default FormGenerator;
