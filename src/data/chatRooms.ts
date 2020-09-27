import { ChatRoom } from "./types";

export const chatRooms: ChatRoom[] = [
  {
    label: "Water Tribe",
    name: "/waterTribe",
  },
  {
    label: "Earth Kingdom",
    name: "/earthKingdom",
  },
  {
    label: "Fire Nation",
    name: "/fireNation",
  },
  {
    label: "Air Nation",
    name: "/airNation",
  },
];

export const chatRoomIsValid = (incomingChatRoom: ChatRoom): boolean => {
  return Boolean(chatRooms.find((room) => room.name === incomingChatRoom.name));
};
