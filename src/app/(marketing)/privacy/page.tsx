import type { Metadata } from "next";
import { Contact, LegalPage } from "@/components/marketing/legal-page";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="29 September 2026">
      <p>Sanchay (&ldquo;we&rdquo;, &ldquo;us&rdquo;) helps you track your accounts, spending, budgets and savings goals. This policy explains what we collect, why, and the choices you have.</p>

      <h2>What we collect</h2>
      <ul>
        <li><strong>Account details:</strong> your name, email address, a securely hashed password, and your language and currency preferences.</li>
        <li><strong>Financial information you enter:</strong> accounts, transactions, budgets, goals, wishlist items and commitments. If you use SMS import, we store the transactions you confirm and the original message text in the transaction notes. We never read your SMS inbox — only text you paste or share with us.</li>
        <li><strong>Technical data:</strong> your IP address and basic request logs, used for security and to prevent abuse.</li>
      </ul>

      <h2>How we use it</h2>
      <ul>
        <li>To provide the service: calculating balances, budgets, goals, insights and reports.</li>
        <li>To keep your account secure, including limiting repeated sign-in attempts.</li>
        <li>To contact you about your account, billing or important service changes.</li>
      </ul>
      <p>We do not sell your data and we do not use your financial information for advertising.</p>

      <h2>Where it is stored</h2>
      <p>Your data is stored in a managed PostgreSQL database with encryption in transit. Only you can see your financial information through the app. Access by our staff is limited to what is needed for support or to keep the service running.</p>

      <h2>Your choices</h2>
      <ul>
        <li>You can edit or delete any entry at any time.</li>
        <li>You can delete your account from Settings. This permanently removes your profile and all your financial data.</li>
        <li>You can ask us for a copy of your data.</li>
      </ul>

      <h2>Cookies</h2>
      <p>We use a secure, HTTP-only cookie to keep you signed in and a cookie that remembers your language. We do not use advertising or tracking cookies.</p>

      <h2>Changes</h2>
      <p>If we make significant changes to this policy we will tell you in the app or by email before they take effect.</p>

      <h2>Contact</h2>
      <p>Questions about privacy? Contact us at <Contact />.</p>
    </LegalPage>
  );
}
