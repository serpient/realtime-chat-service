import {
  validateIncomingMessage,
  validateIncomingUserInfo,
} from "./validation";

it("validates valid incoming message", () => {
  expect(validateIncomingMessage({})).toEqual({
    isValid: false,
    errors: [
      "should have required property 'message'",
      "should have required property 'chatRoom'",
    ],
  });

  expect(validateIncomingMessage({ message: "hello" })).toEqual({
    isValid: false,
    errors: ["should have required property 'chatRoom'"],
  });

  expect(validateIncomingMessage({ message: "hello", chatRoom: {} })).toEqual({
    isValid: false,
    errors: [
      "should have required property 'label'",
      "should have required property 'name'",
    ],
  });

  expect(
    validateIncomingMessage({
      message: "hello",
      chatRoom: { label: "hi", name: "blah" },
    })
  ).toEqual({
    isValid: true,
    errors: [],
  });
});

it("validates incoming user info data", () => {
  expect(validateIncomingUserInfo({ username: "hiya" })).toEqual({
    isValid: false,
    errors: [
      "should have required property 'avatar'",
      "should have required property 'currentRoom'",
    ],
  });
});
