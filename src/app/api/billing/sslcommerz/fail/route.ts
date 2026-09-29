import { appUrl } from "@/lib/server/email";

// Only redirects: this unauthenticated POST can't be trusted to change a payment's status.
export async function POST() {
  return Response.redirect(`${await appUrl()}/billing?payment=failed`, 303);
}
