import { Landing } from "@/components/marketing/landing";

// Signed-out visitors to "/" are rewritten here by the proxy, so the public URL stays "/".
export default function WelcomePage() {
  return <Landing />;
}
