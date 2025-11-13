export interface FieldType {
  id: string;
  type: string;
  label: string;
  name: string;
  placeholder: string;
  required: boolean;
  options: string[];
}

export const DEFAULT_REQUIRED_FIELDS: FieldType[] = [
  {
    id: "field_1",
    type: "text",
    label: "Prénom",
    name: "firstName",
    placeholder: "Votre prénom",
    required: true,
    options: [],
  },
  {
    id: "field_2",
    type: "text",
    label: "Nom",
    name: "lastName",
    placeholder: "Votre nom",
    required: true,
    options: [],
  },
  {
    id: "field_3",
    type: "text",
    label: "Adresse de livraison",
    name: "deliveryAddress",
    placeholder: "Votre adresse de livraison",
    required: true,
    options: [],
  },
];