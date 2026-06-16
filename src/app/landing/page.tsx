import { redirect } from "next/navigation";

// The conversion-page generator now lives at /landing-builder (the flow's
// "Landing" stage). Keep /landing working by redirecting to it so there's a
// single landing-page builder.
export default function LandingRedirect() {
  redirect("/landing-builder");
}
