import Ajv from "ajv";
import jsonSchema from "./data/jsonSchema.json";
import { ChatRoom } from "./data/types";
import { chatRooms } from "./data/chatRooms";

var ajv = new Ajv({ allErrors: true });
var validate = ajv.addSchema(jsonSchema, "all");

type ValidationResult = {
  isValid: boolean;
  errors: string[];
};

export const validateIncomingMessage = (data: any): ValidationResult => {
  const valid = ajv.validate("common#IncomingMessage", data);
  return handleValidation(valid);
};

export const validateIncomingUserInfo = (data: any): ValidationResult => {
  const valid = ajv.validate("common#IncomingUserInfo", data);
  return handleValidation(valid);
};

const handleValidation = (
  valid: boolean | PromiseLike<any>
): ValidationResult => {
  if (!valid) {
    return {
      isValid: false,
      errors: validate.errors.map((err) => err.message),
    };
  } else {
    return { isValid: true, errors: [] };
  }
};

export const chatRoomIsValid = (incomingChatRoom: ChatRoom): boolean => {
  return Boolean(chatRooms.find((room) => room.name === incomingChatRoom.name));
};
