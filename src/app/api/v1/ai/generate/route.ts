import { apiHandler, getBody, jsonOk, jsonError } from "@/lib/api-handler";
import {
  generateMessageSchema,
  type GenerateMessageInput,
} from "@/lib/validations/ai";
import {
  generateMessage,
  LimitExceededError,
} from "@/services/ai-agent.service";

/**
 * POST /api/v1/ai/generate
 *
 * Génère un message IA pour une tâche donnée.
 * Le message est RETOURNÉ mais PAS envoyé — l'agent doit valider manuellement.
 *
 * Body : { taskId: string, channel: "EMAIL"|"SMS"|"WHATSAPP"|"INTERNAL", language?: "FR"|"AR_CLASSIC"|"AR_DIALECT"|"EN" }
 * Réponse : { success: true, data: { generationId, message, prompt, channel, language, warning } }
 *
 * Module : AI_AGENT (BUSINESS / ENTERPRISE uniquement)
 * Rôles : CEO, ADMIN, SUPERVISOR, AGENT
 */
export const POST = apiHandler(
  { module: "AI_AGENT", action: "CREATE", schema: generateMessageSchema },
  async (ctx) => {
    const body = getBody<GenerateMessageInput>(ctx.req);

    try {
      const result = await generateMessage(ctx.user, {
        taskId: body.taskId,
        channel: body.channel,
        language: body.language ?? "FR",
      });

      return jsonOk(result, 201);
    } catch (err) {
      if (err instanceof LimitExceededError) {
        return jsonError(err.message, 429);
      }
      throw err;
    }
  },
);
