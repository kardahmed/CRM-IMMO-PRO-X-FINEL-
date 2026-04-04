import { redirect } from "next/navigation";

/**
 * /demo — redirects to sign-up.
 *
 * Every new sign-up automatically gets a 14-day DEMO workspace
 * during onboarding. No separate demo request form needed.
 */
export default function DemoPage() {
  redirect("/sign-up");
}
