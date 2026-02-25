import { Session } from "next-auth";

export type AdminSession = Session & {
  user: {
    id: string;
    role: string;
  };
};
