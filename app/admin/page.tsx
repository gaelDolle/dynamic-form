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

const BASE_URL = process.env.BASE_URL;

export default async function AdminPage() {
  let formsData: FormType | null = null;
  try {
    const response = await fetch(`${BASE_URL}/api/forms`, {
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
    });
    formsData = (await response.json()) as FormType;
  } catch (error) {
    console.error("Error fetching forms:", error);
  }

  return <FormGenerator initialData={formsData} />;
}
