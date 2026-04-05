// ============================================================================
// Traductions du module Automatisations — CRM IMMO PRO X
// ============================================================================
// Systeme de traduction flat-key pour le module automations.
// Locales supportees : fr, ar (arabe classique), dz (darija algerienne), en.
// ============================================================================

export type Locale = "fr" | "ar" | "dz" | "en";

export const translations: Record<Locale, Record<string, string>> = {
  // ==========================================================================
  // Francais (langue par defaut)
  // ==========================================================================
  fr: {
    // General
    "automations.title": "Automatisations",
    "automations.subtitle": "Panneau de controle des actions automatiques par etape du pipeline.",
    "automations.dashboard": "Tableau de bord",
    "automations.history": "Historique",
    "automations.agents": "Performance des agents",
    "automations.config": "Configuration",

    // Pipeline stages
    "stage.NEW": "Nouveau",
    "stage.CONTACTED": "Contacte",
    "stage.QUALIFIED": "Qualifie",
    "stage.VISIT_SCHEDULED": "Visite planifiee",
    "stage.VISITED": "Visite effectuee",
    "stage.NEGOTIATION": "Negociation",
    "stage.RESERVED": "Reserve",
    "stage.SIGNED": "Signe",
    "stage.CLOSED": "Cloture",

    // Task types
    "type.CALL": "Appel",
    "type.OTHER": "WhatsApp/SMS",
    "type.DOCUMENT": "Document",
    "type.MEETING": "Rendez-vous",
    "type.VISIT": "Visite",
    "type.FOLLOW_UP": "Suivi",

    // Task statuses
    "status.PENDING": "En attente",
    "status.IN_PROGRESS": "En cours",
    "status.COMPLETED": "Terminee",
    "status.CANCELLED": "Annulee",

    // KPI labels
    "kpi.pending": "En attente",
    "kpi.completed": "Executees",
    "kpi.cancelled": "Annulees",
    "kpi.overdue": "En retard",
    "kpi.total": "Total",

    // Dashboard
    "dashboard.byStage": "Par etape",
    "dashboard.byType": "Par type",
    "dashboard.recentTasks": "Taches recentes",
    "dashboard.exportCsv": "Exporter CSV",
    "dashboard.filters": "Filtres",
    "dashboard.dateFrom": "Du",
    "dashboard.dateTo": "Au",
    "dashboard.allAgents": "Tous les agents",
    "dashboard.allStages": "Toutes les etapes",
    "dashboard.allStatuses": "Tous les statuts",
    "dashboard.reset": "Reinitialiser",

    // Supervisor controls
    "supervisor.masterToggle": "Activer/desactiver cette etape",
    "supervisor.taskActive": "Active",
    "supervisor.taskInactive": "Desactivee",
    "supervisor.allAgents": "Tous les agents",
    "supervisor.save": "Enregistrer les modifications",
    "supervisor.saving": "Enregistrement...",
    "supervisor.saved": "Modifications enregistrees",
    "supervisor.templateLabel": "Template de message WhatsApp",
    "supervisor.templateHint": "Variables disponibles:",
    "supervisor.noTemplate": "Pas de template personnalise",

    // Task execution dialog
    "task.execute": "Executer la tache",
    "task.call": "Appeler",
    "task.whatsapp": "WhatsApp",
    "task.sms": "SMS",
    "task.generateAI": "Generer avec IA",
    "task.generateScript": "Generer script d'appel",
    "task.generating": "Generation en cours...",
    "task.sendWhatsApp": "Envoyer via WhatsApp",
    "task.cancel": "Annuler tache",
    "task.postpone": "Reporter",
    "task.finish": "Marquer Terminee",
    "task.note": "Note de conclusion",
    "task.notePlaceholder": "Resume rapide de l'action effectuee...",
    "task.messagePlaceholder": "Redigez votre message ici...",
    "task.deadline": "Echeance",
    "task.overdue": "En retard",
    "task.client": "Client",
    "task.property": "Bien concerne",
    "task.interactions": "Dernieres interactions",
    "task.aiWarning": "Ce message a ete genere par l'IA. Relisez avant envoi.",
    "task.scriptWarning": "Ce script a ete genere par l'IA. Adaptez-le a votre style.",

    // Agent stats
    "agents.title": "Performance des agents",
    "agents.completionRate": "Taux d'execution",
    "agents.avgTime": "Temps moyen",
    "agents.total": "Total",
    "agents.completed": "Terminees",
    "agents.pending": "En attente",
    "agents.overdue": "En retard",

    // History
    "history.title": "Historique des automatisations",
    "history.actionType": "Type d'action",
    "history.all": "Tous",
    "history.triggered": "Declenchement",
    "history.configCreated": "Config creee",
    "history.configUpdated": "Config modifiee",
    "history.enabled": "Activee",
    "history.disabled": "Desactivee",
    "history.aiScript": "Script IA",
    "history.aiMessage": "Message IA",
    "history.taskCompleted": "Tache terminee",
    "history.taskCancelled": "Tache annulee",
    "history.previous": "Precedent",
    "history.next": "Suivant",
    "history.pageOf": "Page {page} sur {total}",

    // Common
    "common.loading": "Chargement...",
    "common.error": "Erreur",
    "common.retry": "Reessayer",
    "common.noData": "Aucune donnee",
    "common.back": "Retour",
  },

  // ==========================================================================
  // Arabe classique (Modern Standard Arabic)
  // ==========================================================================
  ar: {
    // General
    "automations.title": "الأتمتة",
    "automations.subtitle": "لوحة التحكم بالإجراءات التلقائية حسب مرحلة المسار.",
    "automations.dashboard": "لوحة التحكم",
    "automations.history": "السجل",
    "automations.agents": "أداء الوكلاء",
    "automations.config": "الإعدادات",

    // Pipeline stages
    "stage.NEW": "جديد",
    "stage.CONTACTED": "تم الاتصال",
    "stage.QUALIFIED": "مؤهل",
    "stage.VISIT_SCHEDULED": "زيارة مبرمجة",
    "stage.VISITED": "تمت الزيارة",
    "stage.NEGOTIATION": "تفاوض",
    "stage.RESERVED": "محجوز",
    "stage.SIGNED": "موقّع",
    "stage.CLOSED": "مغلق",

    // Task types
    "type.CALL": "مكالمة",
    "type.OTHER": "واتساب/رسالة",
    "type.DOCUMENT": "مستند",
    "type.MEETING": "موعد",
    "type.VISIT": "زيارة",
    "type.FOLLOW_UP": "متابعة",

    // Task statuses
    "status.PENDING": "قيد الانتظار",
    "status.IN_PROGRESS": "قيد التنفيذ",
    "status.COMPLETED": "مكتملة",
    "status.CANCELLED": "ملغاة",

    // KPI labels
    "kpi.pending": "قيد الانتظار",
    "kpi.completed": "منجزة",
    "kpi.cancelled": "ملغاة",
    "kpi.overdue": "متأخرة",
    "kpi.total": "الإجمالي",

    // Dashboard
    "dashboard.byStage": "حسب المرحلة",
    "dashboard.byType": "حسب النوع",
    "dashboard.recentTasks": "المهام الأخيرة",
    "dashboard.exportCsv": "تصدير CSV",
    "dashboard.filters": "التصفية",
    "dashboard.dateFrom": "من",
    "dashboard.dateTo": "إلى",
    "dashboard.allAgents": "جميع الوكلاء",
    "dashboard.allStages": "جميع المراحل",
    "dashboard.allStatuses": "جميع الحالات",
    "dashboard.reset": "إعادة تعيين",

    // Supervisor controls
    "supervisor.masterToggle": "تفعيل/تعطيل هذه المرحلة",
    "supervisor.taskActive": "مفعّلة",
    "supervisor.taskInactive": "معطّلة",
    "supervisor.allAgents": "جميع الوكلاء",
    "supervisor.save": "حفظ التعديلات",
    "supervisor.saving": "جارٍ الحفظ...",
    "supervisor.saved": "تم حفظ التعديلات",
    "supervisor.templateLabel": "قالب رسالة واتساب",
    "supervisor.templateHint": "المتغيرات المتاحة:",
    "supervisor.noTemplate": "لا يوجد قالب مخصص",

    // Task execution dialog
    "task.execute": "تنفيذ المهمة",
    "task.call": "اتصال",
    "task.whatsapp": "واتساب",
    "task.sms": "رسالة قصيرة",
    "task.generateAI": "إنشاء بالذكاء الاصطناعي",
    "task.generateScript": "إنشاء نص المكالمة",
    "task.generating": "جارٍ الإنشاء...",
    "task.sendWhatsApp": "إرسال عبر واتساب",
    "task.cancel": "إلغاء المهمة",
    "task.postpone": "تأجيل",
    "task.finish": "تعيين كمكتملة",
    "task.note": "ملاحظة ختامية",
    "task.notePlaceholder": "ملخص سريع للإجراء المنفّذ...",
    "task.messagePlaceholder": "اكتب رسالتك هنا...",
    "task.deadline": "الموعد النهائي",
    "task.overdue": "متأخرة",
    "task.client": "العميل",
    "task.property": "العقار المعني",
    "task.interactions": "آخر التفاعلات",
    "task.aiWarning": "هذه الرسالة أُنشئت بالذكاء الاصطناعي. يُرجى مراجعتها قبل الإرسال.",
    "task.scriptWarning": "هذا النص أُنشئ بالذكاء الاصطناعي. عدّله ليتناسب مع أسلوبك.",

    // Agent stats
    "agents.title": "أداء الوكلاء",
    "agents.completionRate": "معدل الإنجاز",
    "agents.avgTime": "متوسط الوقت",
    "agents.total": "الإجمالي",
    "agents.completed": "مكتملة",
    "agents.pending": "قيد الانتظار",
    "agents.overdue": "متأخرة",

    // History
    "history.title": "سجل الأتمتة",
    "history.actionType": "نوع الإجراء",
    "history.all": "الكل",
    "history.triggered": "تشغيل تلقائي",
    "history.configCreated": "إنشاء إعداد",
    "history.configUpdated": "تعديل إعداد",
    "history.enabled": "مفعّلة",
    "history.disabled": "معطّلة",
    "history.aiScript": "نص ذكاء اصطناعي",
    "history.aiMessage": "رسالة ذكاء اصطناعي",
    "history.taskCompleted": "مهمة مكتملة",
    "history.taskCancelled": "مهمة ملغاة",
    "history.previous": "السابق",
    "history.next": "التالي",
    "history.pageOf": "الصفحة {page} من {total}",

    // Common
    "common.loading": "جارٍ التحميل...",
    "common.error": "خطأ",
    "common.retry": "إعادة المحاولة",
    "common.noData": "لا توجد بيانات",
    "common.back": "رجوع",
  },

  // ==========================================================================
  // Darija algerienne (الدارجة الجزائرية)
  // ==========================================================================
  // Utilise un melange d'arabe dialectal algerien avec des emprunts au francais
  // courants en Algerie (ex: "كونفيغوراسيون", "ايكسبورتي", "فيلتر").
  // ==========================================================================
  dz: {
    // General
    "automations.title": "الأوتوماتيزاسيون",
    "automations.subtitle": "بانو دي كونترول ديال الأكسيونات الأوتوماتيك على حساب المرحلة.",
    "automations.dashboard": "تابلو دو بور",
    "automations.history": "لّيستوريك",
    "automations.agents": "بيرفورمونس ديال الزعامة",
    "automations.config": "كونفيغوراسيون",

    // Pipeline stages
    "stage.NEW": "جديد",
    "stage.CONTACTED": "تّواصلنا معاه",
    "stage.QUALIFIED": "مؤهل",
    "stage.VISIT_SCHEDULED": "فيزيت مبروغرامي",
    "stage.VISITED": "دارو الفيزيت",
    "stage.NEGOTIATION": "نيغوسياسيون",
    "stage.RESERVED": "ريزيرفي",
    "stage.SIGNED": "سينيي",
    "stage.CLOSED": "مغلوق",

    // Task types
    "type.CALL": "أبّال",
    "type.OTHER": "واتساب/SMS",
    "type.DOCUMENT": "دوكيمون",
    "type.MEETING": "رونديفو",
    "type.VISIT": "فيزيت",
    "type.FOLLOW_UP": "سويفي",

    // Task statuses
    "status.PENDING": "يستنّا",
    "status.IN_PROGRESS": "خدّام عليها",
    "status.COMPLETED": "كملات",
    "status.CANCELLED": "تّلغات",

    // KPI labels
    "kpi.pending": "يستنّاو",
    "kpi.completed": "كملوا",
    "kpi.cancelled": "تّلغاو",
    "kpi.overdue": "فاتهم الوقت",
    "kpi.total": "التوتال",

    // Dashboard
    "dashboard.byStage": "على حساب المرحلة",
    "dashboard.byType": "على حساب النوع",
    "dashboard.recentTasks": "التاشات الأخيرة",
    "dashboard.exportCsv": "ايكسبورتي CSV",
    "dashboard.filters": "فيلتر",
    "dashboard.dateFrom": "من",
    "dashboard.dateTo": "حتى",
    "dashboard.allAgents": "كامل الزعامة",
    "dashboard.allStages": "كامل المراحل",
    "dashboard.allStatuses": "كامل الحالات",
    "dashboard.reset": "ريّيسي",

    // Supervisor controls
    "supervisor.masterToggle": "أكتيفي/ديزاكتيفي هاذ المرحلة",
    "supervisor.taskActive": "أكتيف",
    "supervisor.taskInactive": "ديزاكتيفي",
    "supervisor.allAgents": "كامل الزعامة",
    "supervisor.save": "أونروجيستري التعديلات",
    "supervisor.saving": "راه يسجّل...",
    "supervisor.saved": "التعديلات تسجّلو",
    "supervisor.templateLabel": "تومبلات ديال ميساج واتساب",
    "supervisor.templateHint": "الفاريابل المتاحين:",
    "supervisor.noTemplate": "ما كاين حتى تومبلات",

    // Task execution dialog
    "task.execute": "نفّذ التاش",
    "task.call": "عيّط",
    "task.whatsapp": "واتساب",
    "task.sms": "SMS",
    "task.generateAI": "جينيري بالذكاء الاصطناعي",
    "task.generateScript": "جينيري سكريبت ديال العيطة",
    "task.generating": "راه يجينيري...",
    "task.sendWhatsApp": "ابعث بالواتساب",
    "task.cancel": "أنيلي التاش",
    "task.postpone": "ريبورتي",
    "task.finish": "ماركي كمّلات",
    "task.note": "نوت ديال الخلاصة",
    "task.notePlaceholder": "ريزومي صغير على واش دارت...",
    "task.messagePlaceholder": "اكتب الميساج ديالك هنا...",
    "task.deadline": "الديدلاين",
    "task.overdue": "فات الوقت",
    "task.client": "كليون",
    "task.property": "البيان المعني",
    "task.interactions": "آخر الإنتيراكسيون",
    "task.aiWarning": "هاذ الميساج جينيراه الذكاء الاصطناعي. شوفو مليح قبل ما تبعثو.",
    "task.scriptWarning": "هاذ السكريبت جينيراه الذكاء الاصطناعي. أدابتيه على حساب ستيلك.",

    // Agent stats
    "agents.title": "بيرفورمونس ديال الزعامة",
    "agents.completionRate": "تو ديكزيكوسيون",
    "agents.avgTime": "الوقت المتوسط",
    "agents.total": "التوتال",
    "agents.completed": "كملوا",
    "agents.pending": "يستنّاو",
    "agents.overdue": "فاتهم الوقت",

    // History
    "history.title": "ليستوريك ديال الأوتوماتيزاسيون",
    "history.actionType": "نوع الأكسيون",
    "history.all": "الكل",
    "history.triggered": "ديكلونشمون",
    "history.configCreated": "كونفيغ تخلقات",
    "history.configUpdated": "كونفيغ تبدّلات",
    "history.enabled": "أكتيفي",
    "history.disabled": "ديزاكتيفي",
    "history.aiScript": "سكريبت IA",
    "history.aiMessage": "ميساج IA",
    "history.taskCompleted": "تاش كملات",
    "history.taskCancelled": "تاش تّلغات",
    "history.previous": "اللي قبل",
    "history.next": "اللي بعد",
    "history.pageOf": "صفحة {page} من {total}",

    // Common
    "common.loading": "راه يشارجي...",
    "common.error": "خطأ",
    "common.retry": "عاود حاول",
    "common.noData": "ما كاين والو",
    "common.back": "ارجع",
  },

  // ==========================================================================
  // English
  // ==========================================================================
  en: {
    // General
    "automations.title": "Automations",
    "automations.subtitle": "Control panel for automatic actions at each pipeline stage.",
    "automations.dashboard": "Dashboard",
    "automations.history": "History",
    "automations.agents": "Agent Performance",
    "automations.config": "Configuration",

    // Pipeline stages
    "stage.NEW": "New",
    "stage.CONTACTED": "Contacted",
    "stage.QUALIFIED": "Qualified",
    "stage.VISIT_SCHEDULED": "Visit Scheduled",
    "stage.VISITED": "Visited",
    "stage.NEGOTIATION": "Negotiation",
    "stage.RESERVED": "Reserved",
    "stage.SIGNED": "Signed",
    "stage.CLOSED": "Closed",

    // Task types
    "type.CALL": "Call",
    "type.OTHER": "WhatsApp/SMS",
    "type.DOCUMENT": "Document",
    "type.MEETING": "Meeting",
    "type.VISIT": "Visit",
    "type.FOLLOW_UP": "Follow-up",

    // Task statuses
    "status.PENDING": "Pending",
    "status.IN_PROGRESS": "In Progress",
    "status.COMPLETED": "Completed",
    "status.CANCELLED": "Cancelled",

    // KPI labels
    "kpi.pending": "Pending",
    "kpi.completed": "Completed",
    "kpi.cancelled": "Cancelled",
    "kpi.overdue": "Overdue",
    "kpi.total": "Total",

    // Dashboard
    "dashboard.byStage": "By Stage",
    "dashboard.byType": "By Type",
    "dashboard.recentTasks": "Recent Tasks",
    "dashboard.exportCsv": "Export CSV",
    "dashboard.filters": "Filters",
    "dashboard.dateFrom": "From",
    "dashboard.dateTo": "To",
    "dashboard.allAgents": "All Agents",
    "dashboard.allStages": "All Stages",
    "dashboard.allStatuses": "All Statuses",
    "dashboard.reset": "Reset",

    // Supervisor controls
    "supervisor.masterToggle": "Enable/disable this stage",
    "supervisor.taskActive": "Active",
    "supervisor.taskInactive": "Inactive",
    "supervisor.allAgents": "All Agents",
    "supervisor.save": "Save Changes",
    "supervisor.saving": "Saving...",
    "supervisor.saved": "Changes saved",
    "supervisor.templateLabel": "WhatsApp Message Template",
    "supervisor.templateHint": "Available variables:",
    "supervisor.noTemplate": "No custom template",

    // Task execution dialog
    "task.execute": "Execute Task",
    "task.call": "Call",
    "task.whatsapp": "WhatsApp",
    "task.sms": "SMS",
    "task.generateAI": "Generate with AI",
    "task.generateScript": "Generate Call Script",
    "task.generating": "Generating...",
    "task.sendWhatsApp": "Send via WhatsApp",
    "task.cancel": "Cancel Task",
    "task.postpone": "Postpone",
    "task.finish": "Mark as Completed",
    "task.note": "Closing Note",
    "task.notePlaceholder": "Quick summary of the action taken...",
    "task.messagePlaceholder": "Type your message here...",
    "task.deadline": "Deadline",
    "task.overdue": "Overdue",
    "task.client": "Client",
    "task.property": "Related Property",
    "task.interactions": "Recent Interactions",
    "task.aiWarning": "This message was generated by AI. Please review before sending.",
    "task.scriptWarning": "This script was generated by AI. Adapt it to your style.",

    // Agent stats
    "agents.title": "Agent Performance",
    "agents.completionRate": "Completion Rate",
    "agents.avgTime": "Average Time",
    "agents.total": "Total",
    "agents.completed": "Completed",
    "agents.pending": "Pending",
    "agents.overdue": "Overdue",

    // History
    "history.title": "Automation History",
    "history.actionType": "Action Type",
    "history.all": "All",
    "history.triggered": "Triggered",
    "history.configCreated": "Config Created",
    "history.configUpdated": "Config Updated",
    "history.enabled": "Enabled",
    "history.disabled": "Disabled",
    "history.aiScript": "AI Script",
    "history.aiMessage": "AI Message",
    "history.taskCompleted": "Task Completed",
    "history.taskCancelled": "Task Cancelled",
    "history.previous": "Previous",
    "history.next": "Next",
    "history.pageOf": "Page {page} of {total}",

    // Common
    "common.loading": "Loading...",
    "common.error": "Error",
    "common.retry": "Retry",
    "common.noData": "No data",
    "common.back": "Back",
  },
};
