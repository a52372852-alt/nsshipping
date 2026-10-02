import type { Metadata } from "next";
import PrivateShipping from "@/components/private-shipping";
export const metadata: Metadata = {
  title: "내 롯데택배 분리 출력 | NS Shipping",
  robots: { index: false, follow: false },
};
export default function Page() {
  return <PrivateShipping />;
}
