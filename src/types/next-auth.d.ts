import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      xp: number;
      level: number;
      penaltiesEnabled: boolean;
    };
  }

  interface User {
    xp: number;
    level: number;
    penaltiesEnabled: boolean;
    passwordHash?: string;
  }
}

