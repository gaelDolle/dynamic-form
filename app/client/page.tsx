import ClientFormView from "./client-form-view";

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

export default async function ClientPage() {
  return <ClientFormView />;
}
