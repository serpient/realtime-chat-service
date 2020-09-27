import Ajv from "ajv";
import jsonSchema from "./data/jsonSchema.json";

var ajv = new Ajv({ allErrors: true });
var validate = ajv.addSchema(jsonSchema, "all");

export const validateIncomingMessage = (
  data: any
): { isValid: boolean; errors: string[] } => {
  const valid = ajv.validate("common#IncomingMessage", data);
  if (!valid) {
    return {
      isValid: false,
      errors: validate.errors.map((err) => err.message),
    };
  } else {
    return { isValid: true, errors: [] };
  }
};
