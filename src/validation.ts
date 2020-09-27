import Ajv from "ajv";
import jsonSchema from "./data/jsonSchema.json";
import { ChatRoom } from "./data/types";
import { chatRooms } from "./data/chatRooms";

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

export const chatRoomIsValid = (incomingChatRoom: ChatRoom): boolean => {
  return Boolean(chatRooms.find((room) => room.name === incomingChatRoom.name));
};
