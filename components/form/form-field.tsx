"use client";
import { FieldType } from "@/types/form";
import {
  Checkbox,
  Field,
  Input,
  Select,
  Textarea,
  createListCollection,
} from "@chakra-ui/react";
import {
  Control,
  Controller,
  FieldErrors,
  UseFormRegister,
} from "react-hook-form";

type FormData = Record<string, string | boolean>;

interface FormFieldProps {
  field: FieldType;
  register: UseFormRegister<FormData>;
  errors: FieldErrors<FormData>;
  control: Control<FormData>;
}

const FormField = ({ field, register, errors, control }: FormFieldProps) => {
  const fieldError = errors[field.name];
  const registerOptions = field.required
    ? {
        required: {
          value: true,
          message: `${field.label} est requis`,
        },
        minLength:
          field.type !== "checkbox"
            ? {
                value: 1,
                message: `${field.label} est requis`,
              }
            : undefined,
        validate: (value: string | boolean | undefined) => {
          if (value === undefined || value === null) {
            return `${field.label} est requis`;
          }
          if (typeof value === "string") {
            if (value.trim() === "") {
              return `${field.label} est requis`;
            }
          }
          return true;
        },
      }
    : {};

  return (
    <Field.Root required={field.required} invalid={!!fieldError}>
      <Field.Label>
        {field.label}
        {field.required && <Field.RequiredIndicator />}
      </Field.Label>
      {field.type === "textarea" ? (
        <Textarea
          placeholder={field.placeholder}
          {...register(field.name as keyof FormData, registerOptions)}
          required={false}
        />
      ) : field.type === "select" && field.options.length > 0 ? (
        <Controller
          name={field.name as keyof FormData}
          control={control}
          rules={
            field.required
              ? {
                  required: {
                    value: true,
                    message: `${field.label} est requis`,
                  },
                  minLength: {
                    value: 1,
                    message: `${field.label} est requis`,
                  },
                  validate: (value: string | boolean | undefined) => {
                    if (value === undefined || value === null) {
                      return `${field.label} est requis`;
                    }
                    if (typeof value === "string") {
                      if (value.trim() === "") {
                        return `${field.label} est requis`;
                      }
                    }
                    return true;
                  },
                }
              : {}
          }
          render={({ field: controllerField }) => {
            const value =
              typeof controllerField.value === "string"
                ? controllerField.value
                : "";
            const normalizedOptions = field.options.map((option) =>
              typeof option === "string" ? option : option.value
            );
            return (
              <Select.Root
                collection={createListCollection({
                  items: normalizedOptions,
                })}
                gap={0}
                cursor="pointer"
                value={value ? [value] : []}
                onValueChange={(e) => {
                  controllerField.onChange(e.value[0] || "");
                }}
              >
                <Select.HiddenSelect {...controllerField} value={value} />
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
                    {field.options.map((option) => {
                      const optionValue =
                        typeof option === "string" ? option : option.value;
                      const optionLabel =
                        typeof option === "string" ? option : option.label;
                      return (
                        <Select.Item key={optionValue} item={optionValue}>
                          {optionLabel}
                        </Select.Item>
                      );
                    })}
                  </Select.Content>
                </Select.Positioner>
              </Select.Root>
            );
          }}
        />
      ) : field.type === "checkbox" ? (
        <Checkbox.Root {...register(field.name as keyof FormData)}>
          <Checkbox.Control />
          <Checkbox.Label cursor="pointer">{field.label}</Checkbox.Label>
        </Checkbox.Root>
      ) : (
        <Input
          type={field.type}
          placeholder={field.placeholder}
          {...register(field.name as keyof FormData, registerOptions)}
          required={false}
        />
      )}
      {fieldError && (
        <Field.ErrorText>{fieldError.message as string}</Field.ErrorText>
      )}
    </Field.Root>
  );
};

export default FormField;
