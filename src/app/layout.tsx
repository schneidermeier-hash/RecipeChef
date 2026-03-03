import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "RecipeChef - Abendessen Tracker",
  description: "Erfasse und verwalte deine täglichen Abendessen",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className={`${inter.className} antialiased min-h-screen`}>
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <nav className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link
              href="/"
              className="text-xl font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              RecipeChef
            </Link>
            <div className="flex gap-2">
              <Link
                href="/add"
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-3 rounded-md transition-colors text-sm"
              >
                + Selbst gekocht
              </Link>
              <Link
                href="/add-delivery"
                className="bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-3 rounded-md transition-colors text-sm"
              >
                + Lieferung
              </Link>
            </div>
          </nav>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
