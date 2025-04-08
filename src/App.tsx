
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import React from "react"; // Ensure React is imported
import Index from "./pages/Index";
import TransactionsDashboard from "./pages/TransactionsDashboard";
import KeyDashboard from "./pages/KeyDashboard";
import TransactionDetail from "./pages/TransactionDetail";
import NotFound from "./pages/NotFound";
import WalletPage from './pages/WalletPage';
import { Toaster as ShadcnToaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

// Create a new QueryClient instance outside of the component
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/transactions" element={<TransactionsDashboard />} />
            <Route path="/transaction/:txid" element={<TransactionDetail />} />
            <Route path="/keys" element={<KeyDashboard />} />
            <Route path="/wallet" element={<WalletPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        <ShadcnToaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
