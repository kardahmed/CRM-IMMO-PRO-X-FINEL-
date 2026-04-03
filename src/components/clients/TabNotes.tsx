"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StickyNote, Send, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Note {
  id: string;
  content: string;
  author: string;
  date: string;
}

interface TabNotesProps {
  notes: Note[];
}

export function TabNotes({ notes }: TabNotesProps) {
  const [newNote, setNewNote] = useState("");

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Add note area */}
      <Card className="shadow-sm border-neutral-100 dark:border-neutral-800 overflow-hidden">
        <div className="p-1 bg-accent/30">
          <Textarea 
            placeholder="Tapez votre note, compte-rendu ou observation ici..." 
            className="border-0 shadow-none focus-visible:ring-0 resize-none min-h-[100px] bg-transparent text-sm"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
          />
        </div>
        <div className="flex items-center justify-between p-3 border-t bg-white dark:bg-card">
          <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
            <StickyNote className="h-3.5 w-3.5" />
            Visible par toute l'équipe
          </p>
          <Button size="sm" className="gap-2 font-bold rounded-full h-8" disabled={!newNote.trim()}>
            <Send className="h-3.5 w-3.5" />
            Publier
          </Button>
        </div>
      </Card>

      {/* Notes Feed */}
      <div className="space-y-4 relative">
        {/* Ligne verticale de la timeline */}
        <div className="absolute left-[19px] top-4 bottom-4 w-px bg-border" />

        {notes.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-sm">
            Aucune note sur ce dossier.
          </div>
        ) : (
          notes.map((note) => (
            <div key={note.id} className="relative flex gap-4">
              <Avatar className="h-10 w-10 shrink-0 border z-10 bg-background">
                <AvatarFallback className="text-xs font-black bg-primary/10 text-primary">
                  {note.author.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <Card className="shadow-sm border-neutral-100 dark:border-neutral-800 flex-1">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold">{note.author}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(note.date), { addSuffix: true, locale: fr })}
                    </p>
                  </div>
                  <p className="text-sm text-foreground/80 leading-relaxed">
                    {note.content}
                  </p>
                </CardContent>
              </Card>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
