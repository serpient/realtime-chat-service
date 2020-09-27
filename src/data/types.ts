export interface ChatRoom {
  label: string;
  name: string;
}

export interface IncomingMessage {
  message: string;
  chatRoom: ChatRoom;
}

export interface OutgoingMessageData extends IncomingMessage {
  serverTimestamp: string;
}

export interface OutgoingErrorData {
  message: string;
  status: number;
}

export interface OutgoingMessage {
  data: OutgoingMessageData | null;
  error: OutgoingErrorData | null;
}
