import { BrowserRouter, Route, Routes } from "react-router-dom"
import { AuthProvider } from "@/lib/AuthContext"
import { RequireAuth } from "@/components/layout/RequireAuth"
import { AppLayout } from "@/components/layout/AppLayout"
import { DashboardPage } from "@/pages/DashboardPage"
import { ChatPage } from "@/pages/ChatPage"
import { DocumentsPage } from "@/pages/DocumentsPage"
import { LoginPage } from "@/pages/LoginPage"
import { PlaceholderPage } from "@/pages/PlaceholderPage"

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<RequireAuth />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/documents" element={<DocumentsPage />} />
              <Route path="/sops" element={<PlaceholderPage title="SOPs" />} />
              <Route path="/settings" element={<PlaceholderPage title="Settings" />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
