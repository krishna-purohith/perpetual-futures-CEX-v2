import { z } from "zod";

export const authSchema = z.object({
  username: z.string().min(1, "username cannot be empty"),
  password: z.string().min(1, "password cannot be empty"),
});

export interface TokenPayload {
  userId: string;
}
