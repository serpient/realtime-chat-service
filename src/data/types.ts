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
  errors?: string[];
}

export interface OutgoingMessage {
  data: OutgoingMessageData | null;
  error: OutgoingErrorData | null;
}

export interface IncomingUserInfo {
  username: string;
  avatar: string;
  currentRoom: ChatRoom;
}

export interface OutgoingUserInfo {
  username: string;
  avatar: string;
}

export interface UsersPerRoom {
  [chatRoomName: string]: OutgoingUserInfo[];
}

export interface OutgoingPresenceData {
  usersPerRoom: UsersPerRoom;
  serverTimestamp: string;
}

export interface OutgoingPresenceInformation {
  data: OutgoingPresenceData | null;
  error: OutgoingErrorData | null;
}
