"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail } from "lucide-react";

export function LoginForm() {
  return (
    <Card className="mx-auto max-w-sm">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Mail className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-2xl">Welcome Back</CardTitle>
        <CardDescription>
          Sign in to access your AI-powered mail client
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button 
          className="w-full" 
          size="lg"
          onClick={() => signIn("google")}
        >
          Sign in with Google
        </Button>
      </CardContent>
    </Card>
  );
}
