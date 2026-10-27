<<<<<<< .merge_file_CLaz78
import { useRef, useState } from "react";
import SuperAdminSidebar from "./SuperAdminSidebar";
import {
  useWorkspaceTheme,
  WorkspaceNavigationContext,
} from "../workspace/WorkspaceContext";
import { superadminPages } from "./superadminNavigation";
import Overview, { AuditTable } from "./Overview";
import RolePermissions from "./RolePermissions";
import SuperadminUserManagementView from "../../pages/superadmin/UserManagementView";
import ServiceManagementView from "../../pages/admin/ServiceManagementView";
import ClientManagementView from "../ClientManagementView";
import POSReportsView from "../../pages/admin/POSReportsView";
import OperationalLogsView from "../../pages/admin/OperationalLogsView";
import InventoryManagementView from "../../pages/admin/InventoryManagementView";
import ScheduleManagementView from "../../pages/admin/ScheduleManagementView";
import SuperAdminSettings from "./SuperAdminSettings";
import { defaultMaintenancePreview } from "./superadminPreviewData";
import AccountManagementView from "../../pages/admin/AccountManagementView";
import "./superadmin.css";
=======
import { useRef, useState } from 'react';
import SuperAdminSidebar from './SuperAdminSidebar';
import { useWorkspaceTheme, WorkspaceNavigationContext } from '../workspace/WorkspaceContext';
import { superadminPages } from './superadminNavigation';
import Overview from './Overview';
import SuperadminUserManagementView from '../../pages/superadmin/UserManagementView';
import ServiceManagementView from '../../pages/admin/ServiceManagementView';
import ClientManagementView from '../ClientManagementView';
import SuperadminPOSReportsView from '../../pages/superadmin/POSReportsView';
import SuperadminOperationalLogsView from '../../pages/superadmin/OperationalLogsView';
import SuperadminSystemAuditLogsView from '../../pages/superadmin/SystemAuditLogsView';
import InventoryManagementView from '../../pages/admin/InventoryManagementView';
import ScheduleManagementView from '../../pages/admin/ScheduleManagementView';
import SuperAdminSettings from './SuperAdminSettings';
import { defaultMaintenancePreview } from './superadminPreviewData';
import AccountManagementView from '../../pages/admin/AccountManagementView';
import './superadmin.css';
import { useUnsavedChanges } from '../UnsavedChangesProvider';
import './superadminContent.css';
>>>>>>> .merge_file_EXCGQq

import "./superadminContent.css";

const maintenanceKey = "centyzz-maintenance-ui-preview";
function readMaintenancePreview() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(maintenanceKey));
    if (
      saved &&
      typeof saved.enabled === "boolean" &&
      typeof saved.message === "string" &&
      ["30 minutes", "1 hour", "2 hours", "4 hours"].includes(saved.duration)
    )
      return saved;
  } catch {
    /* Start with the operational preview when storage is unavailable. */
  }
  return defaultMaintenancePreview;
}
<<<<<<< .merge_file_CLaz78

import { useUnsavedChanges } from "../UnsavedChangesProvider";
=======
>>>>>>> .merge_file_EXCGQq

const demoUser = {
  firstName: "Aljean Mark",
  lastName: "Angeles",
  email: "aljeanmark@example.com",
  role: "SUPERADMIN",
  isDemo: true,
};

<<<<<<< .merge_file_CLaz78
export default function SuperAdminLayout({
  currentUser = demoUser,
  onUserUpdated,
  onLogout = () => {
    window.location.href = "/";
  },
}) {
  const [activePage, setActivePage] = useState("dashboard");

  const [maintenance, setMaintenance] = useState(readMaintenancePreview);

  const { guardNavigation } = useUnsavedChanges();

=======
export default function SuperAdminLayout({ currentUser = demoUser, onUserUpdated, onLogout = () => { window.location.href = '/'; } }) {
  const [activePage, setActivePage] = useState('dashboard');
  const { guardNavigation } = useUnsavedChanges();
  const [maintenance, setMaintenance] = useState(readMaintenancePreview);
>>>>>>> .merge_file_EXCGQq
  const workspaceRef = useRef(null);
  const { theme } = useWorkspaceTheme();
  const preview = Boolean(currentUser?.isDemo && !currentUser?.accessToken);
  const name =
    currentUser.fullName ||
    currentUser.name ||
    [currentUser.firstName, currentUser.lastName].filter(Boolean).join(" ") ||
    "Super Admin";

  function navigate(page) {
    if (page === activePage) return;
    guardNavigation(() => {
      setActivePage(page);
      workspaceRef.current?.scrollTo({ top: 0, behavior: "instant" });
    });
  }

  function saveMaintenancePreview(next) {
    setMaintenance(next);
    try {
      sessionStorage.setItem(maintenanceKey, JSON.stringify(next));
    } catch {
      /* Keep preview changes in memory. */
    }
  }

  const views = {
    users: <SuperadminUserManagementView currentUser={currentUser} />,
    services: <ServiceManagementView currentUser={currentUser} />,
    clients: <ClientManagementView currentUser={currentUser} />,
    reports: <SuperadminPOSReportsView currentUser={currentUser} />,
    logs: <SuperadminOperationalLogsView currentUser={currentUser} />,
    inventory: <InventoryManagementView />,
<<<<<<< .merge_file_CLaz78
    schedule: <ScheduleManagementView currentUser={currentUser} />,
    settings: (
      <SuperAdminSettings
        maintenance={maintenance}
        onSaveMaintenance={saveMaintenancePreview}
      />
    ),
    account: (
      <AccountManagementView
        currentUser={currentUser}
        onUserUpdated={onUserUpdated}
      />
    ),
    roles: <RolePermissions />,
    audit: (
      <AuditTable full token={currentUser?.accessToken} preview={preview} />
    ),
=======
    schedule: <ScheduleManagementView />,
    settings: <SuperAdminSettings maintenance={maintenance} onSaveMaintenance={saveMaintenancePreview} />,
    account: <AccountManagementView currentUser={currentUser} onUserUpdated={onUserUpdated} />,
    audit: <AuditTable full token={currentUser?.accessToken} preview={preview} />,

    audit: <SuperadminSystemAuditLogsView currentUser={currentUser} />,
>>>>>>> .merge_file_EXCGQq
  };

  return (
    <WorkspaceNavigationContext.Provider
      value={{ items: superadminPages, navigate }}
    >
      <div className="sa-app workspace-theme" data-theme={theme}>
        <SuperAdminSidebar
          activePage={activePage}
          onNavigate={navigate}
          currentUser={currentUser}
          onLogout={onLogout}
        />
        <div className="sa-main" ref={workspaceRef}>
          <main className="sa-content" key={activePage}>
            {activePage === "dashboard" ? (
              <Overview
                name={name}
                token={currentUser?.accessToken}
                preview={preview}
                maintenance={maintenance}
                onNavigate={navigate}
              />
            ) : (
              views[activePage]
            )}
          </main>
        </div>
      </div>
    </WorkspaceNavigationContext.Provider>
  );
}
