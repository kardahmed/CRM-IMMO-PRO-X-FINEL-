import type { PipelineStage } from "@prisma/client";
import type { IAutomationTask } from "@/services/automation-engine";

/**
 * Configurations par défaut des automatisations pour les 9 étapes du pipeline.
 * Chaque étape déclenche des tâches automatisées avec des délais spécifiques.
 */
export const DEFAULT_AUTOMATION_CONFIGS: Record<PipelineStage, IAutomationTask[]> = {
  // ============================================================================
  // 1. NEW — Lead entrant
  // ============================================================================
  NEW: [
    {
      title: "Appeler le nouveau lead {clientName}",
      type: "CALL",
      delayMinutes: 15, // 15 min après l'entrée du lead
      description: "Premier contact téléphonique pour qualifier le lead",
    },
    {
      title: "Envoyer SMS de bienvenue à {clientName}",
      type: "OTHER",
      delayMinutes: 5,
      description: "SMS automatique de bienvenue avec présentation",
    },
    {
      title: "Envoyer WhatsApp de présentation à {clientName}",
      type: "OTHER",
      delayMinutes: 10,
      description: "Message WhatsApp avec catalogue et coordonnées",
    },
  ],

  // ============================================================================
  // 2. CONTACTED — Premier contact établi
  // ============================================================================
  CONTACTED: [
    {
      title: "Qualifier les besoins de {clientName}",
      type: "CALL",
      delayMinutes: 60, // 1h après
      description: "Appel de qualification : budget, type de bien, localisation souhaitée",
    },
    {
      title: "Envoyer email récapitulatif à {clientName}",
      type: "EMAIL",
      delayMinutes: 120, // 2h après
      description: "Email avec récapitulatif de l'échange et prochaines étapes",
    },
    {
      title: "Relance si pas de réponse de {clientName}",
      type: "CALL",
      delayMinutes: 1440, // 24h après
      description: "Relance téléphonique si le client n'a pas répondu",
    },
  ],

  // ============================================================================
  // 3. QUALIFIED — Besoin et budget validés
  // ============================================================================
  QUALIFIED: [
    {
      title: "Préparer sélection de biens pour {clientName}",
      type: "OTHER",
      delayMinutes: 30,
      description: "Sélectionner 3-5 biens correspondant aux critères du client",
    },
    {
      title: "Envoyer catalogue personnalisé à {clientName}",
      type: "EMAIL",
      delayMinutes: 120, // 2h après
      description: "Email avec les biens sélectionnés et fiches détaillées",
    },
    {
      title: "Proposer des dates de visite à {clientName}",
      type: "CALL",
      delayMinutes: 240, // 4h après
      description: "Appeler pour proposer des créneaux de visite",
    },
  ],

  // ============================================================================
  // 4. VISIT_SCHEDULED — Visite programmée
  // ============================================================================
  VISIT_SCHEDULED: [
    {
      title: "Confirmer la visite avec {clientName}",
      type: "OTHER",
      delayMinutes: 1440, // 24h avant (J-1)
      description: "Envoyer rappel WhatsApp/SMS la veille de la visite",
    },
    {
      title: "Préparer dossier visite pour {clientName}",
      type: "DOCUMENT",
      delayMinutes: 60,
      description: "Préparer les fiches techniques et plans des biens à visiter",
    },
    {
      title: "Rappel jour J visite {clientName}",
      type: "OTHER",
      delayMinutes: 2880, // 48h (rappel matin du jour)
      description: "SMS de rappel le matin de la visite avec l'adresse",
    },
  ],

  // ============================================================================
  // 5. VISITED — Visite effectuée
  // ============================================================================
  VISITED: [
    {
      title: "Recueillir le feedback de {clientName}",
      type: "CALL",
      delayMinutes: 120, // 2h après la visite
      description: "Appeler le client pour connaître ses impressions post-visite",
    },
    {
      title: "Envoyer récapitulatif visite à {clientName}",
      type: "EMAIL",
      delayMinutes: 180, // 3h après
      description: "Email avec photos, plans et détails des biens visités",
    },
    {
      title: "Relance post-visite {clientName}",
      type: "CALL",
      delayMinutes: 2880, // 48h après
      description: "Relance pour savoir si le client souhaite avancer",
    },
  ],

  // ============================================================================
  // 6. NEGOTIATION — Offre / contre-offre en cours
  // ============================================================================
  NEGOTIATION: [
    {
      title: "Préparer simulation financière pour {clientName}",
      type: "DOCUMENT",
      delayMinutes: 60,
      description: "Calculer le plan de paiement et les conditions financières",
    },
    {
      title: "Alerter superviseur — négociation {clientName}",
      type: "OTHER",
      delayMinutes: 5,
      description: "Notification au superviseur qu'une négociation est en cours",
    },
    {
      title: "Relance négociation {clientName}",
      type: "CALL",
      delayMinutes: 1440, // 24h après
      description: "Suivi de la négociation si pas de retour",
    },
  ],

  // ============================================================================
  // 7. RESERVED — Réservation signée
  // ============================================================================
  RESERVED: [
    {
      title: "Générer contrat de réservation pour {clientName}",
      type: "DOCUMENT",
      delayMinutes: 30,
      description: "Préparer le contrat de réservation avec les conditions",
    },
    {
      title: "Envoyer félicitations à {clientName}",
      type: "EMAIL",
      delayMinutes: 15,
      description: "Email de félicitations avec les prochaines étapes",
    },
    {
      title: "Planifier rendez-vous notaire {clientName}",
      type: "MEETING",
      delayMinutes: 1440, // 24h après
      description: "Organiser le RDV chez le notaire pour la signature",
    },
    {
      title: "Collecter documents juridiques de {clientName}",
      type: "DOCUMENT",
      delayMinutes: 240, // 4h après
      description: "Demander CIN, extrait de naissance, justificatifs",
    },
  ],

  // ============================================================================
  // 8. SIGNED — Compromis / acte signé
  // ============================================================================
  SIGNED: [
    {
      title: "Confirmer le paiement de {clientName}",
      type: "OTHER",
      delayMinutes: 60,
      description: "Vérifier que le premier versement a été effectué",
    },
    {
      title: "Envoyer copie signée à {clientName}",
      type: "EMAIL",
      delayMinutes: 120,
      description: "Envoyer par email la copie numérique du contrat signé",
    },
    {
      title: "Mettre à jour statut du bien",
      type: "OTHER",
      delayMinutes: 15,
      description: "Passer le bien en statut RESERVED ou SOLD dans le système",
    },
  ],

  // ============================================================================
  // 9. CLOSED — Transaction finalisée
  // ============================================================================
  CLOSED: [
    {
      title: "Envoyer email de satisfaction à {clientName}",
      type: "EMAIL",
      delayMinutes: 1440, // 24h après la clôture
      description: "Enquête de satisfaction et demande d'avis",
    },
    {
      title: "Remise des clés à {clientName}",
      type: "MEETING",
      delayMinutes: 60,
      description: "Organiser la remise des clés et l'état des lieux",
    },
    {
      title: "Demander recommandation à {clientName}",
      type: "CALL",
      delayMinutes: 10080, // 7 jours après
      description: "Appeler pour demander un parrainage ou recommandation",
    },
  ],
};
