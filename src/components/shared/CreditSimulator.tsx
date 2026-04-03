"use client";

import { useState, useMemo } from "react";
import { Calculator, Send, Percent, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface CreditSimulatorProps {
  initialPrixBien?: number;
}

const TAUX_BANQUES = [
  { id: "cneap", name: "CNEP Banque (Classique)", rate: 5.75 },
  { id: "bna", name: "BNA", rate: 5.5 },
  { id: "islamic", name: "Finance Islamique (Ijara)", rate: 4.5 },
  { id: "bonifie", name: "CPA (Prêt bonifié 1%)", rate: 1.0 },
  { id: "zero", name: "Sans intérêt", rate: 0.0 },
];

export function CreditSimulator({ initialPrixBien = 15000000 }: CreditSimulatorProps) {
  const [prixBien, setPrixBien] = useState<number>(initialPrixBien);
  const [apport, setApport] = useState<number>(3000000);
  const [dureeAns, setDureeAns] = useState<number>(15);
  const [dureeMois, setDureeMois] = useState<number>(0);
  const [selectedTauxObj, setSelectedTauxObj] = useState(TAUX_BANQUES[0]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Calcul mathématique des mensualités
  const simulation = useMemo(() => {
    const loanAmount = Math.max(0, prixBien - apport);
    const months = (dureeAns * 12) + dureeMois;
    const rate = selectedTauxObj.rate;
    
    if (months === 0) return { mensualite: 0, total: 0, totalInterets: 0, loanAmount };
    
    if (rate === 0) {
      const pmf = loanAmount / months;
      return { mensualite: pmf, total: loanAmount, totalInterets: 0, loanAmount };
    }

    const monthlyRate = (rate / 100) / 12;
    const mensualite = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
    const total = mensualite * months;
    
    return {
      loanAmount,
      mensualite,
      total,
      totalInterets: total - loanAmount
    };
  }, [prixBien, apport, dureeAns, dureeMois, selectedTauxObj]);

  const formatDA = (val: number) => new Intl.NumberFormat("fr-DZ", { maximumFractionDigits: 0 }).format(Math.round(val)) + " DA";

  const messageTemplate = `Bonjour 👋
Voici une estimation financière pour votre projet immobilier :

💰 *Prix du bien* : ${formatDA(prixBien)}
🏦 *Apport personnel* : ${formatDA(apport)}
💶 *Montant du prêt* : ${formatDA(simulation.loanAmount)}
⏱ *Durée* : ${dureeAns} ans et ${dureeMois} mois
📊 *Offre bancaire* : ${selectedTauxObj.name} (${selectedTauxObj.rate}%)

📈 *MENSUALITÉ ESTIMÉE* : ${formatDA(simulation.mensualite)} / mois.

N'hésitez pas si vous avez des questions !`;

  return (
    <Card className="shadow-lg border-primary/10 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent pb-4 border-b">
        <CardTitle className="flex items-center gap-2 text-primary font-black uppercase text-lg">
          <Calculator className="h-5 w-5" /> Simulateur de Crédit
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Inputs Section */}
          <div className="space-y-5">
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <label className="text-xs font-bold uppercase text-muted-foreground focus-visible:text-primary">Prix du bien (DA)</label>
                <span className="font-bold text-sm">{formatDA(prixBien)}</span>
              </div>
              <Input 
                type="number" 
                value={prixBien || ""} 
                onChange={(e) => setPrixBien(Number(e.target.value))} 
                className="font-mono font-bold text-lg"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <label className="text-xs font-bold uppercase text-muted-foreground focus-visible:text-primary">Apport personnel (DA)</label>
                <Badge variant="secondary" className="font-black text-xs">
                  {prixBien > 0 ? ((apport / prixBien) * 100).toFixed(1) : 0}%
                </Badge>
              </div>
              <Input 
                type="number" 
                value={apport || ""} 
                onChange={(e) => setApport(Number(e.target.value))} 
                className="font-mono font-bold text-lg"
              />
            </div>

            <div className="space-y-4 pt-2">
              <label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1.5 focus-visible:text-primary">
                <Calendar className="h-3.5 w-3.5" /> Durée ({dureeAns} ans et {dureeMois} mois)
              </label>
              
              <div className="space-y-4 pt-2">
                <Slider 
                  value={[dureeAns]} 
                  min={1} max={30} step={1}
                  onValueChange={(val: number[]) => setDureeAns(val[0])}
                />
                <Slider 
                  value={[dureeMois]} 
                  min={0} max={11} step={1}
                  onValueChange={(val: number[]) => setDureeMois(val[0])}
                  className="[&_[data-slot=slider-track]]:bg-blue-100 [&_[data-slot=slider-range]]:bg-blue-400"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1.5 focus-visible:text-primary">
                <Percent className="h-3.5 w-3.5" /> Offre & Taux
              </label>
              <Select 
                value={selectedTauxObj.id} 
                onValueChange={(val: string | null) => {
                  const found = TAUX_BANQUES.find(t => t.id === val);
                  if (found) setSelectedTauxObj(found);
                }}
              >
                <SelectTrigger className="font-bold border-2 focus:ring-primary/20">
                  <SelectValue placeholder="Choisir une banque..." />
                </SelectTrigger>
                <SelectContent>
                  {TAUX_BANQUES.map((bank) => (
                    <SelectItem key={bank.id} value={bank.id} className="font-bold">
                      {bank.name} <span className="text-muted-foreground ml-2">({bank.rate}%)</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Results Section */}
          <div className="bg-neutral-50 dark:bg-neutral-900 rounded-3xl p-6 flex flex-col justify-between border">
            <div className="space-y-6">
              <div className="text-center p-6 bg-white dark:bg-black rounded-2xl shadow-sm border border-neutral-100 dark:border-neutral-800">
                <p className="text-xs font-black uppercase text-muted-foreground mb-2">Mensualité Estimée</p>
                <p className="text-4xl text-primary font-black tabular-nums">{new Intl.NumberFormat("fr-DZ", { maximumFractionDigits: 0 }).format(simulation.mensualite)} <span className="text-xl text-muted-foreground">DA</span></p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-bold text-muted-foreground">Montant du prêt</span>
                  <span className="font-black font-mono">{formatDA(simulation.loanAmount)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="font-bold text-muted-foreground">Coût des intérêts</span>
                  <span className="font-black font-mono text-red-500">{formatDA(simulation.totalInterets)}</span>
                </div>
                <div className="h-px w-full bg-border" />
                <div className="flex justify-between items-center text-sm">
                  <span className="font-bold text-muted-foreground">Montant total dû</span>
                  <span className="font-black font-mono">{formatDA(simulation.total)}</span>
                </div>
              </div>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger render={<Button className="w-full mt-8 h-12 uppercase font-black text-sm gap-2 shadow-xl shadow-primary/20 hover:-translate-y-0.5 transition-transform" />}>
                <Send className="h-4 w-4" /> Envoyer au client
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Send className="h-5 w-5 text-primary" /> Transmettre la simulation
                  </DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  <Textarea 
                    className="min-h-[250px] font-mono text-xs leading-relaxed" 
                    defaultValue={messageTemplate}
                  />
                  <div className="flex gap-2 mt-4">
                    <Button className="w-full bg-[#25D366] hover:bg-[#25D366]/90 text-white font-bold h-10">WhatsApp</Button>
                    <Button className="w-full font-bold h-10">Email</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

          </div>
        </div>
      </CardContent>
    </Card>
  );
}
