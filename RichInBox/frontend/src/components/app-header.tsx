import type { User } from '../shared-types';
import { Button } from './button';

export function Header({ user, onLogout }: { user: User; onLogout: () => void }) {
  const initials = (user.name ?? user.email).slice(0, 1).toUpperCase();
  return (
    <header className="flex items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 py-3 backdrop-blur sm:px-6">
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-[#9a6cf0] text-sm font-bold text-white shadow-sm shadow-brand/25">
          R
        </div>
        <span className="text-base font-semibold tracking-tight text-slate-900">ReachInbox</span>
      </div>

      <div className="flex items-center gap-3">
        {user.avatarUrl ? (
          <img src={user.avatarUrl} alt="" className="h-9 w-9 rounded-full border border-slate-200 object-cover" />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand/10 text-sm font-semibold text-brand">
            {initials}
          </div>
        )}
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium leading-tight text-slate-900">{user.name ?? 'User'}</p>
          <p className="text-xs leading-tight text-slate-400">{user.email}</p>
        </div>
        <Button variant="secondary" size="sm" onClick={onLogout}>
          Logout
        </Button>
      </div>
    </header>
  );
}
