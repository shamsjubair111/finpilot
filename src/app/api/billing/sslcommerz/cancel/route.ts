import { appUrl } from "@/lib/server/email";

export async function POST() {
  return Response.redirect(`${await appUrl()}/billing?payment=cancelled`, 303);
}
