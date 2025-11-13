import FormGenerator from "./form-generator";

export interface FieldType {
  id: string;
  type: string;
  label: string;
  name: string;
  placeholder: string;
  required: boolean;
  options: string[];
}

export interface FormType {
  id: string;
  fields: FieldType[];
}

export default async function AdminPage() {
  return <FormGenerator />;
}
