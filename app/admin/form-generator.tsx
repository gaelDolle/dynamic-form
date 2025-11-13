"use client";
import FormField from "@/components/form-field";
import { toaster } from "@/components/ui/toaster";
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
  IconButton,
  SimpleGrid,
  Span,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { ChangeEvent, useEffect, useState } from "react";
import { LuDownload, LuRotateCcw, LuSave, LuTrash } from "react-icons/lu";
import { RxMagicWand } from "react-icons/rx";
import { FieldType, FormType } from "./page";
import SelectMCC, { MCCOption, MCC_OPTIONS } from "./select-mcc";

// Quick suggestion chips
const QUICK_SUGGESTIONS = [
  { emoji: "📱", label: "Ajouter téléphone", prompt: "ajoute un champ téléphone" },
  { emoji: "✉️", label: "Ajouter email", prompt: "ajoute un champ email" },
  { emoji: "📅", label: "Ajouter date", prompt: "ajoute un champ date" },
  { emoji: "📝", label: "Ajouter message", prompt: "ajoute un champ message" },
];

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

  const generateFromAI = async (customPrompt?: string) => {
    const currentPrompt = customPrompt || prompt;
    if (!currentPrompt.trim()) return;

    setLoadingAI(true);
    if (!customPrompt) setPrompt("");

    try {
      const currentFields = form?.fields || initialForm?.fields || [];
      const optionalFields = currentFields.filter(f => !f.locked);
      
      console.log("📤 Sending to AI:", {
        prompt: currentPrompt,
        currentOptionalFields: optionalFields,
        history: conversationHistory.map(h => ({ role: h.role, content: h.content }))
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
          history: conversationHistory.map(h => ({ role: h.role, content: h.content })),
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
          setForm({
            ...baseForm,
            fields: [...currentFields, ...newFieldsWithUniqueIds],
          });
        }

        const assistantResponse = JSON.stringify(result);
        const now = new Date();
        setConversationHistory((prev) => [
          ...prev,
          { role: "user", content: currentPrompt, timestamp: now },
          { role: "assistant", content: assistantResponse, timestamp: now },
        ]);
        
        if (!customPrompt) setPrompt("");
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
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `form-${mcc?.value || 'config'}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toaster.success({
      title: "Configuration exportée",
    });
  };

  // Delete individual field
  const handleDeleteField = (fieldId: string) => {
    if (!form) return;

    const updatedFields = form.fields.filter((field) => field.id !== fieldId);
    setForm({ ...form, fields: updatedFields });

    toaster.success({
      title: "Champ supprimé",
    });
  };

  // Count fields
  const lockedFieldsCount = form?.fields.filter(f => f.locked).length || 0;
  const unlockedFieldsCount = form?.fields.filter(f => !f.locked).length || 0;
  const totalFieldsCount = form?.fields.length || 0;

  // Get unique user prompts from history
  const userHistory = conversationHistory.filter((item) => item.role === "user");

  return (
    <Box w="100%" minH="100vh" bg="gray.50">
      <Container maxW="7xl" py={8} px={4}>
        {/* Two Column Layout */}
        <SimpleGrid columns={{ base: 1, lg: 2 }} gap={4} minH="calc(100vh - 4rem)">
          {/* LEFT PANEL - Configuration */}
          <Card.Root bg="white" shadow="md" display="flex" flexDirection="column" h="100%">
            {/* Header */}
            <Card.Header borderBottom="1px solid" borderColor="gray.200">
              <HStack justify="space-between" align="center">
                <Heading size="md" display="flex" alignItems="center" gap={2}>
                  ⚙️ Configuration
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
            <Card.Body flex="1" overflow="auto" display="flex" flexDirection="column">
              {/* MCC Selection */}
              <Box
                bg="gray.50"
                p={3}
                borderRadius="md"
                mb={4}
              >
                <Text fontSize="sm" fontWeight="medium" mb={2}>
                  Votre MCC
                </Text>
                <SelectMCC
                  value={mcc || undefined}
                  onChange={(value: string) => {
                    const option = MCC_OPTIONS.find((opt) => opt.value === value);
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
                  _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px var(--chakra-colors-blue-500)" }}
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
                  <Button
                    variant="outline"
                    colorPalette="gray"
                    onClick={() => setPrompt("")}
                    size="sm"
                    disabled={!prompt}
                  >
                    Effacer
                  </Button>
                </HStack>
              </VStack>

              {/* Quick Suggestions */}
              <Box mt={4}>
                <Text fontSize="sm" fontWeight="medium" mb={2}>
                  💡 Suggestions rapides
                </Text>
                <Flex gap={1} wrap="wrap">
                  {QUICK_SUGGESTIONS.map((suggestion) => (
                    <Button
                      key={suggestion.label}
                      size="xs"
                      variant="outline"
                      colorPalette="gray"
                      onClick={() => generateFromAI(suggestion.prompt)}
                      disabled={loadingAI || !mcc}
                      borderRadius="full"
                      _hover={{ bg: "blue.50", borderColor: "blue.500", color: "blue.600" }}
                    >
                      {suggestion.emoji} {suggestion.label}
                    </Button>
                  ))}
                </Flex>
              </Box>

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
                    📜 Historique
                  </Heading>
                  <Text fontSize="xs" color="gray.500">
                    {userHistory.length} entrées
                  </Text>
                </HStack>

                <Box flex="1" overflow="auto">
                  {userHistory.length === 0 ? (
                    <Box textAlign="center" py={8}>
                      <Text fontSize="3xl" mb={2}>🔭</Text>
                      <Text fontSize="sm" fontWeight="medium" color="gray.600" mb={1}>
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
                          <Box flex="1">
                            <Text fontSize="sm" fontWeight="medium" mb={1}>
                              {item.content}
                            </Text>
                            <Text fontSize="xs" color="gray.500">
                              {item.timestamp.toLocaleTimeString()}
                            </Text>
                          </Box>
                        </Box>
                      ))}
                    </VStack>
                  )}
                </Box>
              </Box>
            </Card.Body>

            {/* Footer */}
            <Card.Footer borderTop="1px solid" borderColor="gray.200" bg="gray.50">
              <HStack justify="flex-start" gap={2} w="100%">
                <Button
                  size="sm"
                  variant="solid"
                  colorPalette="gray"
                  onClick={handleExport}
                  disabled={!form?.fields?.length}
                >
                  <Icon>
                    <LuDownload />
                  </Icon>
                  Exporter
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  colorPalette="red"
                  onClick={handleReset}
                  disabled={conversationHistory.length === 0 || !mcc}
                >
                  <Icon>
                    <LuRotateCcw />
                  </Icon>
                  Réinitialiser
                </Button>
              </HStack>
            </Card.Footer>
          </Card.Root>

          {/* RIGHT PANEL - Preview */}
          <Card.Root bg="white" shadow="md" display="flex" flexDirection="column" h="100%">
            {/* Header */}
            <Card.Header borderBottom="1px solid" borderColor="gray.200">
              <Heading size="md" display="flex" alignItems="center" gap={2}>
                👁️ Aperçu du formulaire
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
                      🔒 {lockedFieldsCount} MCC
                    </Badge>
                  )}
                  {unlockedFieldsCount > 0 && (
                    <Badge colorPalette="blue" size="sm">
                      ✨ {unlockedFieldsCount} IA
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
                  <Text fontSize="4xl" mb={3}>📋</Text>
                  <Text fontSize="md" fontWeight="medium" color="gray.600" mb={2}>
                    Aucun formulaire à afficher
                  </Text>
                  <Text fontSize="sm" color="gray.500">
                    Sélectionnez un MCC pour commencer
                  </Text>
                </Box>
              ) : (
                <VStack align="stretch" gap={3} pb={20}>
                  <SimpleGrid columns={{ base: 1, md: 2 }} gap={3} w="100%">
                    {form.fields.map((field: FieldType) => (
                      <GridItem
                        key={field.id}
                        colSpan={field.type === "textarea" ? 2 : 1}
                      >
                        {/* Field with locked indicator and delete button */}
                        <Box
                          p={3}
                          bg={field.locked ? "gray.50" : "white"}
                          border="1px solid"
                          borderColor="gray.200"
                          borderRadius="md"
                          opacity={field.locked ? 0.95 : 1}
                          _hover={{ 
                            borderColor: "gray.300", 
                            shadow: "sm",
                            "& .delete-btn": {
                              opacity: 1
                            }
                          }}
                          position="relative"
                        >
                          <HStack justify="space-between" align="start" mb={2}>
                            <Box flex="1">
                              <Text fontSize="sm" fontWeight="medium" mb={1}>
                                {field.label}
                                {field.required && (
                                  <Span color="red.500" ml={1}>*</Span>
                                )}
                              </Text>
                              {field.locked ? (
                                <Badge size="xs" colorPalette="gray">
                                  🔒 Champ MCC
                                </Badge>
                              ) : (
                                <Badge size="xs" colorPalette="blue">
                                  ✨ Généré par IA
                                </Badge>
                              )}
                            </Box>
                            {/* Delete button for unlocked fields only */}
                            {/* {!field.locked && (
                              <IconButton
                                className="delete-btn"
                                size="xs"
                                variant="ghost"
                                colorPalette="red"
                                onClick={() => handleDeleteField(field.id)}
                                aria-label="Supprimer le champ"
                                opacity={0}
                                transition="opacity 0.2s"
                              >
                                <Icon>
                                  <LuTrash />
                                </Icon>
                              </IconButton>
                            )} */}
                          </HStack>
                          <FormField field={field} />
                        </Box>
                      </GridItem>
                    ))}
                  </SimpleGrid>

                  {/* Submit Button */}
                  <Button
                    colorPalette="blue"
                    size="md"
                    w="100%"
                    mt={2}
                    onClick={handleSaveAndRedirect}
                  >
                    <Icon>
                      <LuSave />
                    </Icon>
                    Soumettre le formulaire
                  </Button>
                </VStack>
              )}
            </Card.Body>
          </Card.Root>
        </SimpleGrid>
      </Container>
    </Box>
  );
};

export default FormGenerator;