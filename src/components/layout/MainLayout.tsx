
import { ReactNode } from "react";
import { MainNavbar } from "./MainNavbar";
import { FloatingCartButton } from "@/components/cart/FloatingCartButton";

interface MainLayoutProps {
  children: ReactNode;
  onSearch?: () => void;
}

export const MainLayout = ({ children, onSearch }: MainLayoutProps) => {
  return (
    <div className="delivery-app-shell">
      <MainNavbar onSearch={onSearch} />
      <main className="delivery-main">
        {children}
      </main>
      <FloatingCartButton />
    </div>
  );
};
