import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/auth-context';
import { Button } from '../components/button';
import { useToast } from '../components/toast-provider';

export function LoginPage() {
  const { loginWithGoogle, loginAsDemo } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { notify } = useToast();
  const [loading, setLoading] = useState(false);

  const error = params.get('error');

  const handleDemo = async () => {
    setLoading(true);
    try {
      await loginAsDemo();
      navigate('/dashboard');
    } catch {
      notify('Demo login failed - is the backend running?', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f3f1ec] px-4 py-8 text-slate-900 sm:px-6 lg:py-12">
      <div className="w-full max-w-5xl">
        <header className="mb-6 flex items-center justify-between px-1 sm:mb-8">
          <div className="inline-flex items-center gap-2.5" aria-label="ReachInbox">
            <span className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-slate-900 text-sm font-semibold text-white">
              R
            </span>
            <span className="text-base font-semibold tracking-tight">ReachInbox</span>
          </div>
          <span className="hidden text-xs font-medium uppercase tracking-[0.14em] text-slate-500 sm:block">
            Email workspace
          </span>
        </header>

        <div className="grid overflow-hidden rounded-2xl border border-[#e4e0d8] bg-[#fffefa] shadow-[0_24px_70px_-45px_rgba(27,31,35,0.3)] lg:grid-cols-[1.05fr_0.95fr]">
          <section className="flex flex-col justify-between bg-[#eae5dc] p-7 sm:p-10 lg:p-12">
            <div>
              <p className="mb-5 text-xs font-semibold uppercase tracking-[0.16em] text-brand">
                Email scheduling
              </p>
              <h1 className="max-w-md text-3xl font-semibold leading-tight tracking-[-0.035em] text-slate-900 sm:text-4xl">
                Plan the send. Keep the follow-up.
              </h1>
              <p className="mt-4 max-w-md text-sm leading-6 text-slate-600 sm:text-base">
                Queue emails, set a comfortable sending pace, and see what has already gone out.
              </p>
            </div>

            <div className="mt-9 max-w-md rounded-xl border border-[#d9d3c9] bg-[#f8f6f1] p-4 sm:mt-12">
              <div className="mb-4 flex items-center justify-between gap-3">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Schedule preview
                </span>
                <span className="rounded-full bg-[#e5efe7] px-2.5 py-1 text-[11px] font-medium text-[#42684c]">
                  Scheduled
                </span>
              </div>
              <div className="flex items-start gap-3">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">
                    Quick introduction
                  </p>
                  <p className="mt-1 text-xs text-slate-500">Tomorrow · 9:15 AM</p>
                </div>
              </div>
              <div className="mt-4 border-t border-[#e7e2d9] pt-3 text-xs text-slate-500">
                A sample of a scheduled email.
              </div>
            </div>

            <p className="mt-8 hidden text-xs text-slate-500 lg:block">
              Keep your outreach organized and personal.
            </p>
          </section>

          <section className="flex items-center p-7 sm:p-10 lg:p-12" aria-labelledby="login-heading">
            <div className="mx-auto w-full max-w-sm">
              <p className="text-sm font-medium text-brand">Welcome back</p>
              <h2 id="login-heading" className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                Sign in to ReachInbox
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Pick up where you left off with your email campaigns.
              </p>

              {error && (
                <p
                  role="alert"
                  className="mt-6 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700"
                >
                  {error}
                </p>
              )}

              <div className="mt-7 flex flex-col gap-3">
                <Button
                  variant="secondary"
                  onClick={loginWithGoogle}
                  className="min-h-11 w-full rounded-lg border-slate-300 bg-white"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with Google
                </Button>

                <div className="flex items-center gap-3 py-1" aria-hidden="true">
                  <span className="h-px flex-1 bg-slate-200" />
                  <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-400">
                    or
                  </span>
                  <span className="h-px flex-1 bg-slate-200" />
                </div>

                <Button
                  variant="primary"
                  onClick={handleDemo}
                  loading={loading}
                  className="min-h-11 w-full rounded-lg"
                >
                  Use demo account
                </Button>
              </div>

              <p className="mt-5 text-center text-xs leading-5 text-slate-500">
                Demo sign-in is available outside production.
              </p>
              <p className="mt-8 border-t border-slate-200 pt-5 text-center text-xs leading-5 text-slate-400">
                Your email workspace, ready when you are.
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
