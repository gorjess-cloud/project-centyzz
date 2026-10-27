
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './index.css';
import App from './App.jsx';
import SuperAdminLayout from './components/superadmin/SuperAdminLayout.jsx';
import WorkspaceThemeProvider from './components/workspace/WorkspaceThemeProvider.jsx';
import UnsavedChangesProvider from './components/UnsavedChangesProvider.jsx';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_CLIENT_ID";

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={googleClientId || ''}>
      <WorkspaceThemeProvider>
        <UnsavedChangesProvider>
          {import.meta.env.DEV && window.location.pathname === '/superadmin-preview' ? <SuperAdminLayout /> : <App />}
        </UnsavedChangesProvider>
      </WorkspaceThemeProvider>
    </GoogleOAuthProvider>
  </StrictMode>,
);
