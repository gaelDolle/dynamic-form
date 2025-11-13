"use client";
import FormField from "@/components/form/form-field";
import { toaster } from "@/components/ui/toaster";
import { FormType } from "@/types/form";
import {
  Box,
  Button,
  GridItem,
  Heading,
  SimpleGrid,
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
    // TODO : submit en BDD
  };

  if (!form) {
    return <Box>Chargement...</Box>;
  }
  return (
    <Box p={8}>
      <Heading mb={6}>Formulaire</Heading>
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
            <Button type="submit" colorPalette="blue" size="md" w="100%">
              Soumettre
            </Button>
          )}
        </VStack>
      </form>
    </Box>
  );
};

export default ClientFormView;
