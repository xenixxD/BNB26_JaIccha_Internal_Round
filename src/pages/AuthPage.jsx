import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, User, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export const AuthPage = () => {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('sohan@creatorai.io');
  const [password, setPassword] = useState('creator123');

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-canvas text-ink-primary flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-border-subtle rounded-panel p-8 space-y-6 shadow-sm">
        <div className="text-center space-y-2">
          <div className="inline-flex w-10 h-10 rounded-btn bg-accent items-center justify-center text-white font-bold text-lg shadow-sm mb-1">
            C
          </div>
          <h1 className="text-title-page font-bold text-ink-primary">
            {isSignUp ? 'Create your Account' : 'Welcome to CreatorAI'}
          </h1>
          <p className="text-body-sm text-ink-muted">
            Professional AI-Powered Creator Operating Platform
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <Input label="FULL NAME" placeholder="Sohan Das" icon={User} required />
          )}

          <Input
            label="EMAIL ADDRESS"
            type="email"
            icon={Mail}
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <div>
            <label className="block text-micro text-ink-muted uppercase tracking-widest font-semibold mb-1">PASSWORD</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-ink-muted absolute left-2.5 top-2.5 pointer-events-none stroke-[1.75]" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-[32px] bg-white border border-border-subtle hover:border-border-strong focus:border-accent text-ink-primary text-xs rounded-btn pl-8 pr-8"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-2 text-ink-muted hover:text-ink-primary"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <Button type="submit" variant="primary" className="w-full h-[36px]" icon={ArrowRight}>
            {isSignUp ? 'Sign Up & Launch' : 'Sign In to Workspace'}
          </Button>
        </form>

        <div className="pt-4 border-t border-border-subtle text-center text-body-sm text-ink-muted">
          <span>{isSignUp ? 'Already have an account?' : "Don't have an account?"} </span>
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-accent font-semibold hover:underline"
          >
            {isSignUp ? 'Sign In' : 'Create One'}
          </button>
        </div>
      </div>
    </div>
  );
};
