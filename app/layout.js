import { Noto_Sans_Georgian } from "next/font/google";
import "./globals.css";

const notoSansGeorgian = Noto_Sans_Georgian({
  variable: "--font-main",
  subsets: ["georgian", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata = {
  title: "საპოვნელა — Georgia's Medicine Price Finder",
  description:
    "Find the cheapest medicines near you in Tbilisi. Compare prices across independent pharmacies in Georgia.",
  keywords:
    "medicine, pharmacy, Georgia, Tbilisi, price, წამალი, აფთიაქი, საქართველო",
  openGraph: {
    title: "საპოვნელა — Find Affordable Medicine Near You",
    description:
      "Compare medicine prices across pharmacies in Tbilisi, Georgia",
    url: "https://www.sapovnela.com",
    siteName: "საპოვნელა",
    locale: "ka_GE",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="ka"
      className={`${notoSansGeorgian.variable} h-full antialiased`}
    >
      <body
        className="min-h-full flex flex-col"
        style={{ fontFamily: "var(--font-main), system-ui, sans-serif" }}
      >
        {children}
      </body>
    </html>
  );
}
