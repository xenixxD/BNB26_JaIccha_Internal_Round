import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export const AuthPage = () => {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen bg-canvas flex items-center justify-center p-5">
      <section className="w-full max-w-lg rounded-panel border border-border-subtle bg-white p-6 sm:p-8 text-center">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-btn bg-accent text-lg font-bold text-white">C</div>
        <h1 className="mt-4 text-xl font-semibold text-ink-primary">CreatorAI uses a local workspace</h1>
        <p className="mt-2 text-sm leading-6 text-ink-muted">
          This version does not have sign-in or user accounts. Anyone who can open this app can access its local projects, so do not use it to protect private work on a shared server.
        </p>
        <Button className="mt-6" variant="primary" onClick={() => navigate('/')}>Open workspace</Button>
      </section>
    </main>
  );
};
