"use client";
import {
  Box,
  Button,
  Card,
  Checkbox,
  Container,
  Field,
  Flex,
  GridItem,
  HStack,
  Heading,
  Icon,
  IconButton,
  Input,
  Select,
  SimpleGrid,
  Text,
  Textarea,
  VStack,
  createListCollection,
} from "@chakra-ui/react";
import { ChangeEvent, useEffect, useState } from "react";
import { LuSave, LuTrash } from "react-icons/lu";
import { RxMagicWand } from "react-icons/rx";
import { FieldType, FormType } from "./page";
import SelectMCC, { MCCOption, MCC_OPTIONS } from "./select-mcc";

const FormGenerator = () => {
  const [prompt, setPrompt] = useState("");
  const [loadingAI, setLoadingAI] = useState(false);
  const [initialForm, setInitialForm] = useState<FormType | null>(null);
  const [mcc, setMcc] = useState<MCCOption | null>(null);
  const [form, setForm] = useState<FormType | null>(null);
  const [conversationHistory, setConversationHistory] = useState<
    Array<{ role: "user" | "assistant"; content: string; timestamp: Date }>
  >([]);

  useEffect(() => {
    const fetchFormByMCC = async () => {
      console.log("🚀 ~ fetchFormByMCC ~ mcc:", mcc);
      if (!mcc?.value) {
        setConversationHistory([]);
        setForm(null);
        setPrompt("");
        return;
      }

      try {
        setLoadingAI(true);
        const res = await fetch(`/api/forms/${mcc.value}`, {
          method: "GET",
          cache: "no-store",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const formData = await res.json();
        setInitialForm(formData as FormType);
        setForm(formData as FormType);
        setConversationHistory([]);
        setPrompt("");
      } catch (err) {
        const error =
          err instanceof Error ? err.message : "Une erreur est survenue";
        console.error("Error fetching form by MCC:", error);
      } finally {
        setLoadingAI(false);
      }
    };

    fetchFormByMCC();
  }, [mcc]);

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

      if (result.fields && Array.isArray(result.fields)) {
        // Ensure initial fields (field_1, field_2, field_3) are always present
        const INITIAL_FIELD_IDS = ["field_1", "field_2", "field_3"];
        const currentFields = form?.fields || initialForm?.fields || [];
        const initialFields = currentFields.filter((f: FieldType) =>
          INITIAL_FIELD_IDS.includes(f.id)
        );
        const newFields = result.fields.filter(
          (f: FieldType) => !INITIAL_FIELD_IDS.includes(f.id)
        );

        const baseForm = form || initialForm;
        if (baseForm) {
          setForm({ ...baseForm, fields: [...initialFields, ...newFields] });
        }

        // Mettre à jour l'historique de conversation
        const assistantResponse = JSON.stringify(result);
        const now = new Date();
        setConversationHistory((prev) => [
          ...prev,
          { role: "user", content: currentPrompt, timestamp: now },
          { role: "assistant", content: assistantResponse, timestamp: now },
        ]);
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

  useEffect(() => {
    console.log(
      "🚀 ~ FormGenerator ~ conversationHistory:",
      conversationHistory
    );
  }, [conversationHistory]);

  return (
    <Box w="100%" minH="100vh" bg="gray.100">
      <Container fluid py={32} px={16} maxW="7xl">
        <Flex
          minH="80vh"
          p={4}
          gap={4}
          wrap="wrap"
          flexDirection={{ base: "column", md: "row" }}
        >
          {/* AI Prompt input */}
          <Card.Root
            flex={{ base: "1", md: "0.4" }}
            bg="white"
            p={4}
            borderRadius="md"
            shadow="md"
          >
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
              {/* Conversation history */}
              {conversationHistory?.filter((item) => item.role === "user")
                .length === 0 && (
                <Text fontSize="sm" color="gray.500" my={4}>
                  Aucun historique
                </Text>
              )}
              <Box
                as="ul"
                listStyleType="circle"
                my={4}
                px={8}
                color="gray.500"
                fontSize="sm"
              >
                {conversationHistory
                  ?.filter((item) => item.role === "user")
                  .map((item) => (
                    <li key={item.content}>
                      <VStack gap={0} align="flex-start">
                        <Text fontSize="sm" fontWeight="bold">
                          {item.content}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          {item.timestamp.toLocaleTimeString()}
                        </Text>
                      </VStack>
                    </li>
                  ))}
              </Box>
              <Flex justify="flex-end">
                {conversationHistory.length > 0 && (
                  <IconButton
                    onClick={() => {
                      setConversationHistory([]);
                      setForm(initialForm);
                      setPrompt("");
                    }}
                    size="sm"
                    colorPalette="gray"
                    variant="surface"
                    w="auto"
                  >
                    <Icon>
                      <LuTrash />
                    </Icon>
                  </IconButton>
                )}
              </Flex>
            </Card.Body>
          </Card.Root>

          {/* Form preview */}
          <Card.Root
            flex={{ base: "1", md: "0.6" }}
            bg="white"
            p={4}
            borderRadius="md"
            shadow="md"
          >
            <Card.Body position="relative">
              <Heading size="md" mb={3}>
                Preview
              </Heading>
              <VStack gap={4} pb={16}>
                <SimpleGrid columns={{ base: 1, md: 2 }} gap={4} w="100%">
                  {form?.fields.map((field: FieldType) => (
                    <GridItem
                      key={field.id}
                      colSpan={field.type === "textarea" ? 2 : 1}
                    >
                      <Field.Root required={field.required}>
                        <Field.Label>
                          {field.label}
                          {field.required && <Field.RequiredIndicator />}
                        </Field.Label>
                        {field.type === "textarea" ? (
                          <Textarea placeholder={field.placeholder} />
                        ) : field.type === "select" &&
                          field.options.length > 0 ? (
                          <Select.Root
                            collection={createListCollection({
                              items: field.options,
                            })}
                            gap={0}
                            cursor="pointer"
                          >
                            <Select.HiddenSelect />
                            <Select.Label />
                            <Select.Control>
                              <Select.Trigger>
                                <Select.ValueText
                                  placeholder={field.placeholder}
                                />
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
                    </GridItem>
                  ))}
                </SimpleGrid>
                {!!form?.fields?.length && (
                  <Button
                    colorPalette="gray"
                    variant="surface"
                    size="sm"
                    w="100%"
                  >
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
                <Button
                  colorPalette="green"
                  variant="surface"
                  size="sm"
                  disabled={!form?.fields?.length}
                >
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
