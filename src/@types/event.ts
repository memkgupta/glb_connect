export type FormField = {
    _id?:string,
    fieldLabel: string; // Label for the field (e.g., 'Name', 'Motivation')
    fieldType: 'text' | 'textarea' | 'number' | 'date' | 'select' | 'radio' | 'checkbox' | 'image'; // Field type options
    isRequired?: boolean; // Indicates whether the field is mandatory
    options?: string[]; // Options for select, radio, or checkbox fields
    placeholder?: string; // Placeholder text (optional)
  };
  
 export type AddFormBody = {
    event:string,
    formName: string; // Name of the form
    fields: FormField[]; // Array of fields
  };

  export type UpdateFormBody = {
    formId:string,
    formName?:string,
    fieldUpdates?:FormField[]
  }