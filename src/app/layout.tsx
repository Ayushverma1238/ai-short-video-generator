import { ClerkProvider } from "@clerk/nextjs";
import Provider from "@/app/provider";
import { Roboto } from "next/font/google";
import "./globals.css";
const roboto = Roboto({
  weight: ["400", "700"],
  subsets: ["latin"],
});
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={roboto.className}>
          <Provider>{children}</Provider>
        </body>
      </html>
    </ClerkProvider>
  );
}
