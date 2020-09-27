export interface ChatRoom {
  label: string;
  name: string;
}

export interface OutgoingMessage {
  message: string;
  chatRoom: ChatRoom;
}
