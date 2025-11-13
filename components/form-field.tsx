"use client";
import {
  Checkbox,
  Field,
  Input,
  Select,
  Textarea,
  createListCollection,
} from "@chakra-ui/react";
import { FieldType } from "../app/admin/page";

interface FormFieldProps {
  field: FieldType;
}

const FormField = ({ field }: FormFieldProps) => {
  return (
    <Field.Root required={field.required}>
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
          gap={0}
          cursor="pointer"
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
        <Input type={field.type} placeholder={field.placeholder} />
      )}
    </Field.Root>
  );
};

export default FormField;
