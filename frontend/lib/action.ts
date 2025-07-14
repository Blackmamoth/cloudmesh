import { headers } from "next/headers";
import { auth } from "./auth";
import httpErrors from "http-errors";

export const getUserFromSession = async () => {
  const data = await auth.api.getSession({
    headers: await headers(),
  });
  if (!data?.user && !data?.session) {
    throw httpErrors.Unauthorized("Unauthorized");
  }
  return data.user;
};
