import type { Metadata } from "next";
import { Contact, LegalPage } from "@/components/marketing/legal-page";
import { TRIAL_DAYS } from "@/lib/plans";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="29 September 2026">
      <p>By creating an account or using Sanchay you agree to these terms. If you do not agree, please do not use the service.</p>

      <h2>The service</h2>
      <p>Sanchay is a personal finance tool for tracking money you manage elsewhere. It does not hold, move or invest your money, and it is not a bank, payment service or financial adviser. Figures such as affordability scores, projections and insights are estimates to help you plan and are not financial advice.</p>

      <h2>Your account</h2>
      <ul>
        <li>You must give accurate sign-up information and keep your password secure.</li>
        <li>You are responsible for activity on your account.</li>
        <li>You must be old enough to form a binding contract where you live.</li>
      </ul>

      <h2>Plans, trials and payment</h2>
      <ul>
        <li>The Free plan is free with the limits shown on the pricing page.</li>
        <li>New accounts receive a {TRIAL_DAYS}-day Pro trial. When it ends, the account moves to the Free plan automatically and keeps all its data.</li>
        <li>Paid plans are billed in advance for the period you choose. Prices may change with at least 30 days&rsquo; notice.</li>
        <li>If you go over a Free plan limit after a trial or paid period ends, existing entries stay; you just can&rsquo;t add more until you upgrade or remove some.</li>
      </ul>

      <h2>Acceptable use</h2>
      <p>Do not misuse the service: no attempts to access other people&rsquo;s data, disrupt the service, or use it for anything unlawful.</p>

      <h2>Your data</h2>
      <p>You own the data you enter. You can delete your account at any time from Settings. How we handle data is described in our Privacy Policy.</p>

      <h2>Availability and liability</h2>
      <p>We work to keep Sanchay available and accurate but provide it &ldquo;as is&rdquo;. To the extent the law allows, we are not liable for indirect losses or for decisions made using figures from the app.</p>

      <h2>Ending the service</h2>
      <p>You can stop using Sanchay at any time. We may suspend accounts that break these terms.</p>

      <h2>Contact</h2>
      <p>Questions about these terms? Contact us at <Contact />.</p>
    </LegalPage>
  );
}
