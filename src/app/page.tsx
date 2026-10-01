import ShippingApp from "@/components/shipping-app";
import type { Metadata } from "next";
export const metadata: Metadata = { alternates: { canonical: "/" } };
export default function Page() {
  return <ShippingApp />;
}
