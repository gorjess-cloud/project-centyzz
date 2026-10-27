import { useState } from 'react';
import { Check, LockKeyhole } from 'lucide-react';
import SuperAdminHeader from './SuperAdminHeader';

const resources = ['Dashboard', 'Users', 'Services', 'Clients', 'Reports', 'Logs', 'Inventory', 'Schedule', 'Settings', 'Roles & permissions', 'System audit logs'];
const defaults = { Admin: resources.slice(0, 9), Staff: ['Dashboard', 'Services', 'Clients', 'Schedule'] };

export default function RolePermissions() {
  const [role, setRole] = useState('Admin');
  const [permissions, setPermissions] = useState(() => {
    try {
      const savedPermissions = JSON.parse(sessionStorage.getItem('centyzz-demo-permissions'));
      return savedPermissions && ['Admin', 'Staff'].every(key => Array.isArray(savedPermissions[key])) ? savedPermissions : defaults;
    } catch {
      return defaults;
    }
  });
  const [saved, setSaved] = useState(false);
  const locked = role === 'Super admin';
  function toggle(resource) {
    setPermissions(previous => ({ ...previous, [role]: previous[role].includes(resource) ? previous[role].filter(item => item !== resource) : [...previous[role], resource] }));
    setSaved(false);
  }
  return <>
    <SuperAdminHeader title="Roles & permission controls" description="Manage which workspace sections each role can access." />
    <section className="sa-card sa-roles">
      <div className="sa-role-tabs" role="group" aria-label="Select role">
        {['Super admin', 'Admin', 'Staff'].map(item => (
          <button key={item} aria-pressed={role === item} className={role === item ? 'active' : ''} onClick={() => { setRole(item); setSaved(false); }}>{item}</button>
        ))}
      </div>
      <p className="sa-role-description"><LockKeyhole size={15} />{locked ? 'Super admins have full access. These permissions are locked.' : `Select the sections available to ${role.toLowerCase()} users.`}</p>
      <div className="sa-permission-grid">
        {resources.map(resource => (
          <label key={resource}><span>{resource}</span><input type="checkbox" checked={locked || permissions[role].includes(resource)} disabled={locked} onChange={() => toggle(resource)} /></label>
        ))}
      </div>
      <div className="sa-role-save">
        <p role="status">{saved ? <><Check size={16} /> Demo permissions saved for this session.</> : 'Frontend demo · Changes apply only to this preview session.'}</p>
        <button className="sa-button" disabled={locked} onClick={() => { sessionStorage.setItem('centyzz-demo-permissions', JSON.stringify(permissions)); setSaved(true); }}>Save demo permissions</button>
      </div>
    </section>
  </>;
}
