"use client";

import React from 'react';
import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import { Session } from 'next-auth';

type SessionProviderProps = {
  children: React.ReactNode;
  session: Session | null;
};

// Proper NextAuth SessionProvider implementation
export const SessionProvider = ({ children, session }: SessionProviderProps) => {
  return <NextAuthSessionProvider session={session}>{children}</NextAuthSessionProvider>;
};
