import type { PipelineStage } from "@prisma/client";

// ============================================================================
// Types
// ============================================================================

export interface IWhatsAppTemplateContext {
  clientName: string;
  agentName: string;
  companyName: string;
  propertyName?: string;
  visitDate?: string;
  visitTime?: string;
  price?: string;
}

// ============================================================================
// Templates par etape pipeline (francais)
// ============================================================================

const TEMPLATES_FR: Record<PipelineStage, (ctx: IWhatsAppTemplateContext) => string> = {
  NEW: (ctx) =>
    `Bonjour ${ctx.clientName}, bienvenue chez ${ctx.companyName}. Je suis ${ctx.agentName}, votre conseiller immobilier. Je serais ravi de discuter de votre projet. Quand etes-vous disponible pour un appel ?`,

  CONTACTED: (ctx) =>
    `Bonjour ${ctx.clientName}, suite a notre echange, je vous confirme que je travaille sur une selection de biens adaptes a vos criteres. Je reviens vers vous tres vite avec des propositions.`,

  QUALIFIED: (ctx) =>
    `Bonjour ${ctx.clientName}, j'ai selectionne des biens qui correspondent a vos criteres. Souhaitez-vous que nous programmions des visites ? Je suis disponible cette semaine.`,

  VISIT_SCHEDULED: (ctx) =>
    ctx.visitDate
      ? `Bonjour ${ctx.clientName}, je vous confirme notre visite le ${ctx.visitDate}${ctx.visitTime ? ` a ${ctx.visitTime}` : ""}${ctx.propertyName ? ` pour ${ctx.propertyName}` : ""}. A bientot !`
      : `Bonjour ${ctx.clientName}, je vous confirme notre prochaine visite. Je vous enverrai les details tres bientot.`,

  VISITED: (ctx) =>
    `Bonjour ${ctx.clientName}, merci pour votre visite${ctx.propertyName ? ` de ${ctx.propertyName}` : ""}. J'espere que le bien vous a plu. N'hesitez pas a me faire part de vos impressions et questions.`,

  NEGOTIATION: (ctx) =>
    `Bonjour ${ctx.clientName}, concernant ${ctx.propertyName ?? "le bien qui vous interesse"}${ctx.price ? ` (${ctx.price})` : ""}, je suis a votre disposition pour discuter des conditions. Quand pouvons-nous en parler ?`,

  RESERVED: (ctx) =>
    `Felicitations ${ctx.clientName} ! Votre reservation pour ${ctx.propertyName ?? "votre bien"} est confirmee. Je vous enverrai tous les documents necessaires pour la suite. Bravo !`,

  SIGNED: (ctx) =>
    `Bonjour ${ctx.clientName}, je vous confirme la signature de votre contrat pour ${ctx.propertyName ?? "votre bien"}. Toute l'equipe ${ctx.companyName} vous felicite ! Je reste a votre disposition pour la suite.`,

  CLOSED: (ctx) =>
    `Bonjour ${ctx.clientName}, toute l'equipe ${ctx.companyName} vous souhaite beaucoup de bonheur dans votre nouveau bien ! Si vous avez des questions ou si vous connaissez quelqu'un qui cherche, n'hesitez pas a nous contacter.`,
};

// ============================================================================
// Templates par etape pipeline (arabe dialectal algerien)
// ============================================================================

const TEMPLATES_AR_DIALECT: Record<PipelineStage, (ctx: IWhatsAppTemplateContext) => string> = {
  NEW: (ctx) =>
    `مرحبا ${ctx.clientName}، أهلا بيك في ${ctx.companyName}. أنا ${ctx.agentName}، مستشارك العقاري. نتمنى نهدرو على مشروعك، وقتاش تقدر/ي؟`,

  CONTACTED: (ctx) =>
    `مرحبا ${ctx.clientName}، بعد ما هدرنا، راني نخدم على اختيار ديال عقارات تناسب معاييرك. نرجعلك قريب بالاقتراحات.`,

  QUALIFIED: (ctx) =>
    `مرحبا ${ctx.clientName}، لقيت عقارات تناسبك. حاب/ة نبرمجو زيارات؟ أنا متفرغ هاد السيمانة.`,

  VISIT_SCHEDULED: (ctx) =>
    ctx.visitDate
      ? `مرحبا ${ctx.clientName}، نأكدلك الزيارة نهار ${ctx.visitDate}${ctx.visitTime ? ` على ${ctx.visitTime}` : ""}${ctx.propertyName ? ` ل ${ctx.propertyName}` : ""}. نتلاقاو!`
      : `مرحبا ${ctx.clientName}، نأكدلك الزيارة الجاية. نرسلك التفاصيل قريب.`,

  VISITED: (ctx) =>
    `مرحبا ${ctx.clientName}، شكرا على الزيارة${ctx.propertyName ? ` ديال ${ctx.propertyName}` : ""}. نتمنى عجبك. قولي رأيك!`,

  NEGOTIATION: (ctx) =>
    `مرحبا ${ctx.clientName}، بخصوص ${ctx.propertyName ?? "العقار لي عجبك"}${ctx.price ? ` (${ctx.price})` : ""}، أنا مستعد نناقشو الشروط. وقتاش نتلاقاو؟`,

  RESERVED: (ctx) =>
    `مبروك ${ctx.clientName}! الحجز ديالك ل ${ctx.propertyName ?? "العقار"} تأكد. نرسلك الوثائق الضرورية. برافو!`,

  SIGNED: (ctx) =>
    `مرحبا ${ctx.clientName}، نأكدلك توقيع العقد ديال ${ctx.propertyName ?? "العقار"}. فريق ${ctx.companyName} كامل يباركلك!`,

  CLOSED: (ctx) =>
    `مرحبا ${ctx.clientName}، فريق ${ctx.companyName} يتمنالك السعادة في دارك الجديدة! إذا عندك سؤال ولا تعرف شي واحد يحوس، ما تترددش تتصل بينا.`,
};

// ============================================================================
// API publique
// ============================================================================

export type WhatsAppTemplateLanguage = "FR" | "AR_DIALECT";

/**
 * Genere un message WhatsApp pre-rempli selon l'etape pipeline.
 */
export function getWhatsAppTemplate(
  stage: PipelineStage,
  context: IWhatsAppTemplateContext,
  language: WhatsAppTemplateLanguage = "FR",
): string {
  const templates = language === "AR_DIALECT" ? TEMPLATES_AR_DIALECT : TEMPLATES_FR;
  return templates[stage](context);
}

/**
 * Genere un lien wa.me/ avec message pre-rempli.
 * Le numero est normalise au format international sans le +.
 */
export function buildWhatsAppLink(phone: string, message: string): string {
  // Normaliser le numero : retirer espaces, tirets, parentheses
  let normalized = phone.replace(/[\s\-()]/g, "");

  // Convertir format local algerien en international
  if (normalized.startsWith("0")) {
    normalized = "213" + normalized.substring(1);
  } else if (normalized.startsWith("+")) {
    normalized = normalized.substring(1);
  }

  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${normalized}?text=${encodedMessage}`;
}

/**
 * Detecte si un tenant a l'API WhatsApp configuree.
 * Retourne true si les cles API sont presentes dans les settings.
 */
export function hasWhatsAppApi(tenantSettings: Record<string, unknown>): boolean {
  const wa = tenantSettings?.whatsapp as Record<string, unknown> | undefined;
  return Boolean(wa?.whatsappApiKey && wa?.whatsappPhoneId);
}
