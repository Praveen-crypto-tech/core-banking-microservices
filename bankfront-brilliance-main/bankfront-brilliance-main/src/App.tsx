import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import CustomersPage from "./pages/CustomersPage";
import AccountsPage from "./pages/AccountsPage";
import TransactionsPage from "./pages/TransactionsPage";
import LedgerPage from "./pages/LedgerPage";
import CardsPage from "./pages/CardsPage";
import LoansPage from "./pages/LoansPage";
import FraudPage from "./pages/FraudPage";
import ComplaintsPage from "./pages/ComplaintsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/accounts" element={<AccountsPage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/ledger" element={<LedgerPage />} />
          <Route path="/cards" element={<CardsPage />} />
          <Route path="/loans" element={<LoansPage />} />
          <Route path="/fraud" element={<FraudPage />} />
          <Route path="/complaints" element={<ComplaintsPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
