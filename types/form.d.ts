export interface FieldType {
  id: string;
  type: string;
  label: string;
  name: string;
  placeholder: string;
  required: boolean;
  options: string[];
  locked?: boolean;
  value?: string | boolean;
}

export interface FormType {
  id: string;
  fields: FieldType[];
}
