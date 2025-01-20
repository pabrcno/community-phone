export type TCall = {
  id: number;
  callId: string;
  from: string;
  to: string;
  started: string;
  ended?: string;
  duration?: number;
  createdAt: string;
  updatedAt: string;
};
