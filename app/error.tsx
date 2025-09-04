"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, Home, RefreshCw, Terminal } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Il est recommandé d'envoyer les erreurs à un service de reporting (Sentry, LogRocket, etc.)
    console.error("Application error:", error);
  }, [error]);

  const isDatabaseError =
    error.name === "DatabaseError" ||
    error.message.includes("Database") ||
    error.message.includes("ECONNREFUSED") ||
    error.message.includes("connection");

  const errorTitle = isDatabaseError
    ? "Erreur de connexion à la base de données"
    : "Une erreur est survenue";

  const errorDescription = isDatabaseError
    ? "Nous ne parvenons pas à nous connecter à la base de données. Il s'agit peut-être d'un problème temporaire."
    : "Une erreur inattendue s'est produite. Veuillez nous excuser pour la gêne occasionnée.";

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        {/* En-tête de la carte avec icône, titre et description */}
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-semibold tracking-tight">
            {errorTitle}
          </CardTitle>
          <CardDescription>{errorDescription}</CardDescription>
        </CardHeader>

        {/* Contenu principal, affichant les détails de l'erreur si nécessaire */}
        <CardContent className="space-y-4">
          {isDatabaseError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Détails techniques</AlertTitle>
              <AlertDescription>
                <p className="mb-2 text-sm">Causes possibles :</p>
                <ul className="list-inside list-disc space-y-1 pl-2 text-sm">
                  <li>Le serveur de base de données est hors ligne.</li>
                  <li>Problèmes de connectivité réseau.</li>
                  <li>Erreurs de configuration.</li>
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Affiche l'erreur détaillée uniquement en environnement de développement */}
          {process.env.NODE_ENV === "development" && (
            <Alert>
              <Terminal className="h-4 w-4" />
              <AlertTitle>Pour les développeurs</AlertTitle>
              <AlertDescription>
                <div className="mt-2 rounded-md bg-muted p-2">
                  <code className="text-xs text-muted-foreground break-all">
                    {error.message}
                  </code>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>

        {/* Pied de page avec les boutons d'action */}
        <CardFooter className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button onClick={() => reset()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Réessayer
          </Button>
          <Button variant="secondary" asChild>
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Retour à l'accueil
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}