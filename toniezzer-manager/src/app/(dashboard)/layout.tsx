import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { CurrentUserProvider } from "@/lib/hooks/use-current-user";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CurrentUserProvider>
      <div className="min-h-screen bg-background">
        <Sidebar />
        <div className="pl-64 transition-all duration-300">
          <Header />
          <main className="p-6">{children}</main>
        </div>
      </div>
    </CurrentUserProvider>
  );
}

