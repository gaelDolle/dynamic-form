"use client";
import FormField from "@/components/form/form-field";
import { toaster } from "@/components/ui/toaster";
import { FormType } from "@/types/form";
import {
  Box,
  Button,
  Container,
  GridItem,
  Heading,
  HStack,
  SimpleGrid,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

type FormData = Record<string, string | boolean>;

const ClientFormView = () => {
  const [form] = useState<FormType | null>(() => {
    const storedForm = localStorage.getItem("form");
    return storedForm ? (JSON.parse(storedForm) as FormType) : null;
  });

  const {
    register,
    handleSubmit,
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
          defaultValues[field.name] =
            form.fields.find((f) => f.name === field.name)?.value || false;
        } else {
          defaultValues[field.name] =
            form.fields.find((f) => f.name === field.name)?.value || "";
        }
      });
      reset(defaultValues as FormData);
    }
  }, [form, reset]);

  const onSubmit = (data: FormData) => {
    console.log("Données du formulaire:", data);

    toaster.success({
      title: "Données enregistrées",
      description: Object.keys(data).map((key) => (
        <HStack alignItems="flex-start" gap={1} key={key} w="100%">
          <Text>{key}:</Text>
          <Text as="span" fontWeight="bold">
            {data[key]}
          </Text>
        </HStack>
      )),
      duration: Infinity,
      closable: true,
    });
  };

  if (!form) return null;

  return (
    <Box w="100%" minH="100vh" bg="gray.100" py={8} px={4}>
      <Container maxW="7xl" py={8} px={8} bg="white">
        <Heading mb={2}>Formulaire client</Heading>
        <Heading size="sm" color="gray.500" mb={6}>
          Merci de saisir quelques informations avant votre achat
        </Heading>
        <form
          noValidate
          onSubmit={handleSubmit(onSubmit, () => {
            toaster.error({
              title: "Données invalides, veuillez vérifier votre saisie",
            });
          })}
        >
          <VStack gap={4} align="stretch">
            <SimpleGrid columns={{ base: 1, md: 2 }} gap={4} w="100%">
              {form.fields.map((field) => (
                <GridItem
                  key={field.id}
                  colSpan={field.type === "textarea" ? 2 : 1}
                >
                  <FormField
                    field={field}
                    register={register}
                    errors={errors}
                    control={control}
                  />
                </GridItem>
              ))}
            </SimpleGrid>
            {form.fields.length > 0 && (
              <Button
                type="submit"
                colorPalette="blue"
                size="sm"
                w="100%"
                mt={6}
              >
                Soumettre
              </Button>
            )}
          </VStack>
        </form>
      </Container>
    </Box>
  );
};

export default ClientFormView;
