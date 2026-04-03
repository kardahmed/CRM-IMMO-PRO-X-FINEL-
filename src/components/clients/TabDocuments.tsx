"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Download, UploadCloud, File, FileLock } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Document {
  id: string;
  title: string;
  type: string;
  url: string;
  uploadedAt: string;
  size: string;
}

interface TabDocumentsProps {
  documents: Document[];
}

export function TabDocuments({ documents }: TabDocumentsProps) {
  const getIconForType = (type: string) => {
    switch (type) {
      case "IDENTITY": return <File className="h-8 w-8 text-blue-500" />;
      case "CONTRACT": return <FileLock className="h-8 w-8 text-rose-500" />;
      default: return <FileText className="h-8 w-8 text-neutral-500" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-black flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Dossier numérique ({documents.length})
        </h3>
        <Button size="sm" className="gap-2 font-bold bg-primary hover:bg-primary/90 text-white rounded-full">
          <UploadCloud className="h-4 w-4" />
          Importer un document
        </Button>
      </div>

      {documents.length === 0 ? (
        <Card className="border-dashed shadow-sm">
          <CardContent className="flex flex-col items-center justify-center h-48 text-muted-foreground p-6 text-center">
            <FileText className="h-10 w-10 mb-4 opacity-20" />
            <p className="font-medium text-lg text-foreground">Aucun document</p>
            <p className="text-sm mt-1">Le dossier de ce client est vide.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {documents.map((doc) => (
            <Card key={doc.id} className="group relative overflow-hidden transition-all hover:shadow-md border-neutral-100 dark:border-neutral-800">
              <CardContent className="p-4 flex flex-col items-center text-center gap-3">
                <div className="h-16 w-16 rounded-2xl bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center group-hover:scale-110 transition-transform">
                  {getIconForType(doc.type)}
                </div>
                <div>
                  <p className="font-bold text-sm line-clamp-1" title={doc.title}>{doc.title}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Ajouté le {format(new Date(doc.uploadedAt), "dd MMM yyyy", { locale: fr })} • {doc.size}
                  </p>
                </div>
                <Button variant="ghost" size="icon" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm border">
                  <Download className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
