"use client";
import FormField from "@/components/form/form-field";
import { toaster } from "@/components/ui/toaster";
import { FieldType, FormType } from "@/types/form";
import { capitalize } from "@/utils/capitalize";
import {
  Badge,
  Box,
  Button,
  Card,
  Container,
  Flex,
  GridItem,
  HStack,
  Heading,
  Icon,
  SimpleGrid,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { ChangeEvent, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { LuDownload, LuLock, LuRotateCcw, LuSave } from "react-icons/lu";
import { RxMagicWand } from "react-icons/rx";
import SelectMCC, {
  MCCOption,
  MCC_OPTIONS,
} from "../../components/form/select-mcc";

type FormData = Record<string, string | boolean>;

const FormGenerator = () => {
  const [prompt, setPrompt] = useState("");
  const [loadingAI, setLoadingAI] = useState(false);
  const [initialForm, setInitialForm] = useState<FormType | null>(null);
  const [mcc, setMcc] = useState<MCCOption | null>(null);
  const [form, setForm] = useState<FormType | null>(null);
  const [conversationHistory, setConversationHistory] = useState<
    Array<{ role: "user" | "assistant"; content: string; timestamp: Date }>
  >([]);
  const router = useRouter();

  const {
    register,
    control,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    mode: "onSubmit",
    reValidateMode: "onChange",
    shouldUnregister: false,
  });

  useEffect(() => {
    if (form) {
      const defaultValues: FormData = {};
      form.fields.forEach((field) => {
        if (field.type === "checkbox") {
          defaultValues[field.name] = false;
        } else {
          defaultValues[field.name] = "";
        }
      });
      reset(defaultValues);
    }
  }, [form, reset]);

  useEffect(() => {
    const fetchFormByMCC = async () => {
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
        toaster.error({
          title: "Erreur",
          description: "Impossible de charger le formulaire",
        });
      } finally {
        setLoadingAI(false);
      }
    };

    fetchFormByMCC();
  }, [mcc]);

  const generateFromAI = async () => {
    const currentPrompt = prompt?.trim();
    if (!currentPrompt) return;

    setLoadingAI(true);

    try {
      const currentFields = form?.fields || initialForm?.fields || [];
      const optionalFields = currentFields.filter((f) => !f.locked);

      console.log("📤 Sending to AI:", {
        prompt: currentPrompt,
        currentOptionalFields: optionalFields,
        history: conversationHistory.map((h) => ({
          role: h.role,
          content: h.content,
        })),
      });

      const res = await fetch("/api/forms/prompt", {
        method: "POST",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: currentPrompt,
          currentFields: optionalFields,
          history: conversationHistory.map((h) => ({
            role: h.role,
            content: h.content,
          })),
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result = await res.json();

      console.log("📥 Received from AI:", result);

      if (result?.fields && Array.isArray(result?.fields)) {
        const existingFieldIds = currentFields.map((f: FieldType) => f.id);
        const existingFieldNames = currentFields.map((f: FieldType) => f.name);

        const trulyNewFields = result.fields.filter(
          (f: FieldType) => !existingFieldNames.includes(f.name)
        );

        const getMaxFieldId = () => {
          return Math.max(
            ...existingFieldIds.map((id) => {
              const match = id.match(/field_(\d+)/);
              return match ? parseInt(match[1], 10) : 0;
            }),
            0
          );
        };

        let nextId = getMaxFieldId();
        const usedIds = new Set(existingFieldIds);
        const newFieldsWithUniqueIds = trulyNewFields.map(
          (field: FieldType) => {
            if (usedIds.has(field.id)) {
              nextId += 1;
              const newId = `field_${nextId}`;
              usedIds.add(newId);
              return {
                ...field,
                id: newId,
                locked: false,
              };
            }
            usedIds.add(field.id);
            return {
              ...field,
              locked: false,
            };
          }
        );

        const baseForm = form || initialForm;
        if (baseForm) {
          const lockedFields = currentFields.filter((f) => f.locked);
          const aiReturnedFields = result.fields;

          setForm({
            ...baseForm,
            fields: [...lockedFields, ...aiReturnedFields],
          });
        }

        const assistantResponse = JSON.stringify(result);
        const now = new Date();
        setConversationHistory((prev) => [
          ...prev,
          { role: "user", content: currentPrompt, timestamp: now },
          { role: "assistant", content: assistantResponse, timestamp: now },
        ]);
      }
    } catch (err) {
      const error =
        err instanceof Error ? err.message : "Une erreur est survenue";
      console.error(error);
      toaster.error({
        title: "Erreur IA",
        description: "Impossible de générer les champs",
      });
    } finally {
      setPrompt("");
      setLoadingAI(false);
    }
  };

  const handleReset = () => {
    setConversationHistory([]);
    setForm(initialForm);
    setPrompt("");
  };

  const handleClearAll = () => {
    setMcc(null);
    setForm(null);
    setInitialForm(null);
    setConversationHistory([]);
    setPrompt("");
  };

  const handleSaveAndRedirect = () => {
    if (!form || !form.fields) return;

    localStorage.setItem("form", JSON.stringify(form));
    toaster.success({
      title: "Formulaire enregistré avec succès",
    });
    setTimeout(() => {
      router.push("/client");
    }, 1000);
  };

  const handleExport = () => {
    if (!form) return;

    const dataStr = JSON.stringify(form, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    const exportFileDefaultName = `form-${mcc?.value || "config"}.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();

    toaster.success({
      title: "Configuration exportée",
    });
  };

  // Count fields
  const lockedFieldsCount = form?.fields.filter((f) => f.locked).length || 0;
  const unlockedFieldsCount = form?.fields.filter((f) => !f.locked).length || 0;
  const totalFieldsCount = form?.fields.length || 0;

  // Get unique user prompts from history
  const userHistory = conversationHistory.filter(
    (item) => item.role === "user"
  );

  return (
    <Box w="100%" minH="100vh" bg="gray.100">
      <Container maxW="7xl" py={8} px={4}>
        {/* Two Column Layout */}
        <Flex
          direction={{ base: "column", md: "row" }}
          gap={4}
          minH="calc(100vh - 4rem)"
        >
          {/* LEFT PANEL - Configuration */}
          <Card.Root
            shadow="md"
            display="flex"
            flex={{ base: "1", md: "0.4" }}
            flexDirection="column"
            minH="100%"
          >
            {/* Header */}
            <Card.Header borderBottom="1px solid" borderColor="gray.200">
              <HStack justify="space-between" align="center">
                <Heading size="md" display="flex" alignItems="center" gap={2}>
                  Configuration
                </Heading>
                <Button
                  size="sm"
                  variant="ghost"
                  colorPalette="gray"
                  onClick={handleClearAll}
                  disabled={!mcc}
                >
                  Effacer
                </Button>
              </HStack>
            </Card.Header>

            {/* Body */}
            <Card.Body
              flex="1"
              overflow="auto"
              display="flex"
              flexDirection="column"
            >
              {/* MCC Selection */}
              <Box bg="gray.50" p={3} borderRadius="md" mb={4}>
                <Text fontSize="sm" fontWeight="medium" mb={2}>
                  Votre MCC
                </Text>
                <SelectMCC
                  value={mcc || undefined}
                  onChange={(value: string) => {
                    const option = MCC_OPTIONS.find(
                      (opt) => opt.value === value
                    );
                    setMcc(option || null);
                  }}
                />
                <Text fontSize="xs" color="gray.500" mt={1}>
                  Sélectionnez votre code MCC pour charger les champs par défaut
                </Text>
              </Box>

              {/* AI Prompt Section */}
              <VStack align="stretch" gap={3}>
                <Text fontSize="sm" fontWeight="medium">
                  ✨ AI Prompt
                </Text>
                <Textarea
                  value={prompt}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                    setPrompt(e.target.value)
                  }
                  placeholder="Ex: Ajoute un champ téléphone et email..."
                  minH="100px"
                  maxH="150px"
                  borderColor="gray.200"
                  _focus={{
                    borderColor: "blue.500",
                    boxShadow: "0 0 0 1px var(--chakra-colors-blue-500)",
                  }}
                />
                <Text fontSize="xs" color="gray.600">
                  Utilisez un langage naturel pour décrire les champs
                </Text>

                <HStack gap={2}>
                  <Button
                    flex="1"
                    colorPalette="blue"
                    onClick={() => generateFromAI()}
                    loading={loadingAI}
                    size="sm"
                    disabled={loadingAI || !mcc}
                  >
                    <Icon>
                      <RxMagicWand />
                    </Icon>
                    Générer avec IA
                  </Button>
                </HStack>
              </VStack>
              {/* History Section */}
              <Box
                mt={4}
                pt={4}
                borderTop="1px solid"
                borderColor="gray.200"
                flex="1"
                overflow="hidden"
                display="flex"
                flexDirection="column"
              >
                <HStack justify="space-between" align="center" mb={2}>
                  <Heading size="sm" display="flex" alignItems="center" gap={1}>
                    Historique
                  </Heading>
                  <Text fontSize="xs" color="gray.500">
                    {userHistory.length} entrées
                  </Text>
                </HStack>

                <Box flex="1" overflow="auto">
                  {userHistory.length === 0 ? (
                    <Box textAlign="center" py={8}>
                      <Text fontSize="3xl" mb={2}>
                        🔭
                      </Text>
                      <Text
                        fontSize="sm"
                        fontWeight="medium"
                        color="gray.600"
                        mb={1}
                      >
                        Aucun historique
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        Vos modifications apparaîtront ici
                      </Text>
                    </Box>
                  ) : (
                    <VStack align="stretch" gap={2}>
                      {userHistory.map((item, index) => (
                        <Box
                          key={index}
                          p={2}
                          bg="gray.50"
                          borderRadius="md"
                          borderLeft="3px solid"
                          borderLeftColor="blue.500"
                        >
                          <VStack alignItems="flex-start" gap={0}>
                            <Text fontSize="sm" fontWeight="medium">
                              {capitalize(item.content)}
                            </Text>
                            <Text fontSize="xs" color="gray.500">
                              {item.timestamp.toLocaleTimeString()}
                            </Text>
                          </VStack>
                        </Box>
                      ))}
                    </VStack>
                  )}
                </Box>
              </Box>
            </Card.Body>

            {/* Footer */}
            <Card.Footer
              borderTop="1px solid"
              borderColor="gray.200"
              bg="white"
            >
              <HStack justify="center" gap={3} w="100%" mt={2}>
                <Button
                  size="sm"
                  variant="outline"
                  colorPalette="blue"
                  onClick={handleExport}
                  disabled={!form?.fields?.length}
                  borderRadius="md"
                  fontWeight="medium"
                  _hover={{ bg: "blue.50", borderColor: "blue.500" }}
                >
                  <Icon fontSize="lg">
                    <LuDownload />
                  </Icon>
                  Exporter JSON
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  colorPalette="red"
                  onClick={handleReset}
                  disabled={conversationHistory.length === 0 || !mcc}
                  borderRadius="md"
                  fontWeight="medium"
                  _hover={{ bg: "red.50" }}
                >
                  <Icon fontSize="lg">
                    <LuRotateCcw />
                  </Icon>
                  Réinitialiser
                </Button>
              </HStack>
            </Card.Footer>
          </Card.Root>

          {/* RIGHT PANEL - Preview */}
          <Card.Root
            bg="white"
            shadow="md"
            display="flex"
            flexDirection="column"
            minH="100%"
            flex={{ base: "1", md: "0.6" }}
          >
            {/* Header */}
            <Card.Header borderBottom="1px solid" borderColor="gray.200">
              <Heading size="md" display="flex" alignItems="center" gap={2}>
                Aperçu du formulaire
              </Heading>
            </Card.Header>

            {/* Body */}
            <Card.Body flex="1" overflow="auto">
              {/* Toolbar */}
              <Flex
                justify="space-between"
                align="center"
                p={3}
                bg="gray.50"
                borderRadius="md"
                mb={4}
              >
                <Text fontSize="sm" color="gray.600">
                  Formulaire dynamique
                </Text>
                <HStack gap={2}>
                  {lockedFieldsCount > 0 && (
                    <Badge colorPalette="gray" size="sm">
                      <Icon>
                        <LuLock />
                      </Icon>
                      {lockedFieldsCount} MCC
                    </Badge>
                  )}
                  {unlockedFieldsCount > 0 && (
                    <Badge colorPalette="blue" size="sm">
                      <Icon>
                        <RxMagicWand />
                      </Icon>
                      {unlockedFieldsCount} IA
                    </Badge>
                  )}
                  <Text fontSize="sm" fontWeight="medium">
                    {totalFieldsCount} champs
                  </Text>
                </HStack>
              </Flex>

              {/* Form Preview */}
              {!form?.fields?.length ? (
                <Box textAlign="center" py={16}>
                  <Text fontSize="4xl" mb={3}>
                    📋
                  </Text>
                  <Text
                    fontSize="md"
                    fontWeight="medium"
                    color="gray.600"
                    mb={2}
                  >
                    Aucun formulaire à afficher
                  </Text>
                  <Text fontSize="sm" color="gray.500">
                    Sélectionnez un MCC pour commencer
                  </Text>
                </Box>
              ) : (
                <VStack
                  //alignItems="stretch"
                  gap={3}
                  pb={20}
                  justifyContent="space-between"
                  h="100%"
                  position="relative"
                >
                  <SimpleGrid columns={{ base: 1, md: 2 }} gap={3} w="100%">
                    {form.fields.map((field: FieldType) => (
                      <GridItem
                        key={field.id}
                        colSpan={field.type === "textarea" ? 2 : 1}
                      >
                        {/* Field with locked indicator and delete button */}
                        <Box
                          p={3}
                          pb={2}
                          bg={"white"}
                          border="1px solid"
                          borderColor="gray.200"
                          borderRadius="md"
                          opacity={field.locked ? 0.95 : 1}
                          boxShadow={"xs"}
                          _hover={{
                            borderColor: "gray.300",
                            shadow: "sm",
                            "& .delete-btn": {
                              opacity: 1,
                            },
                          }}
                          position="relative"
                        >
                          <FormField
                            field={field}
                            register={register}
                            errors={errors}
                            control={control}
                          />
                          <HStack
                            justify="flex-end"
                            align="start"
                            my={2}
                            color="gray.600"
                          >
                            {field.locked ? (
                              <Badge colorPalette="gray" size="sm">
                                <Icon boxSize={2}>
                                  <LuLock />
                                </Icon>
                                <Text fontSize="2xs">Champ MCC</Text>
                              </Badge>
                            ) : (
                              <Badge colorPalette="gray" size="sm">
                                <Icon boxSize={2}>
                                  <RxMagicWand />
                                </Icon>
                                <Text fontSize="2xs">Généré par IA</Text>
                              </Badge>
                            )}
                          </HStack>
                        </Box>
                      </GridItem>
                    ))}
                  </SimpleGrid>

                  {/* Submit Button */}
                  {!!form?.fields?.length && (
                    <Button
                      colorPalette="green"
                      variant="surface"
                      size="sm"
                      w="100%"
                      mt={2}
                      onClick={handleSaveAndRedirect}
                      position="absolute"
                      bottom={4}
                    >
                      <Icon>
                        <LuSave />
                      </Icon>
                      Sauvegarder le formulaire
                    </Button>
                  )}
                </VStack>
              )}
            </Card.Body>
          </Card.Root>
        </Flex>
      </Container>
    </Box>
  );
};

export default FormGenerator;
