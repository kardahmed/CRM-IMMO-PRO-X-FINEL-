// ============================================================================
// Systeme d'internationalisation (i18n) — IMMO PRO-X
// ============================================================================
// Supporte : Francais (fr), Arabe classique (ar), Anglais (en)
// L'arabe dialectal algerien est gere par l'AI Agent, pas par l'interface.
// ============================================================================

export type Locale = "fr" | "ar" | "en";

export const SUPPORTED_LOCALES: Locale[] = ["fr", "ar", "en"];

export const LOCALE_NAMES: Record<Locale, string> = {
  fr: "Francais",
  ar: "العربية",
  en: "English",
};

export const LOCALE_DIRECTION: Record<Locale, "ltr" | "rtl"> = {
  fr: "ltr",
  ar: "rtl",
  en: "ltr",
};

export const DEFAULT_LOCALE: Locale = "fr";

// ============================================================================
// Dictionnaire de traductions
// ============================================================================

export interface ITranslations {
  // Navigation
  nav: {
    dashboard: string;
    pipeline: string;
    clients: string;
    planning: string;
    projects: string;
    portfolio: string;
    map: string;
    owners: string;
    mandates: string;
    commissions: string;
    automations: string;
    ai: string;
    objectives: string;
    performance: string;
    documents: string;
    notifications: string;
    settings: string;
    auditLog: string;
    cadastre: string;
    portalManager: string;
    payments: string;
  };
  // Sections navigation
  sections: {
    principal: string;
    promotion: string;
    agency: string;
    tools: string;
    admin: string;
  };
  // Actions communes
  actions: {
    create: string;
    edit: string;
    delete: string;
    save: string;
    cancel: string;
    search: string;
    filter: string;
    export: string;
    import: string;
    back: string;
    next: string;
    previous: string;
    skip: string;
    confirm: string;
    close: string;
    refresh: string;
    download: string;
    upload: string;
    send: string;
    call: string;
    whatsapp: string;
    sms: string;
    email: string;
  };
  // Labels communs
  common: {
    loading: string;
    noData: string;
    error: string;
    success: string;
    welcome: string;
    logout: string;
    profile: string;
    name: string;
    phone: string;
    status: string;
    date: string;
    type: string;
    price: string;
    agent: string;
    client: string;
    property: string;
    project: string;
    visit: string;
    task: string;
    all: string;
  };
  // Pipeline
  pipeline: {
    new: string;
    contacted: string;
    qualified: string;
    visitScheduled: string;
    visited: string;
    negotiation: string;
    reserved: string;
    signed: string;
    closed: string;
  };
}

// ============================================================================
// Francais (langue par defaut)
// ============================================================================

const fr: ITranslations = {
  nav: {
    dashboard: "Tableau de bord",
    pipeline: "Pipeline",
    clients: "Clients",
    planning: "Planning",
    projects: "Projets",
    portfolio: "Portefeuille",
    map: "Carte",
    owners: "Proprietaires",
    mandates: "Mandats",
    commissions: "Commissions",
    automations: "Automatisations",
    ai: "Assistant IA",
    objectives: "Objectifs",
    performance: "Performance",
    documents: "Documents",
    notifications: "Notifications",
    settings: "Parametres",
    auditLog: "Journal",
    cadastre: "Cadastre",
    portalManager: "Portail Client",
    payments: "Paiements",
  },
  sections: {
    principal: "Principal",
    promotion: "Promotion",
    agency: "Agence",
    tools: "Outils",
    admin: "Administration",
  },
  actions: {
    create: "Creer",
    edit: "Modifier",
    delete: "Supprimer",
    save: "Enregistrer",
    cancel: "Annuler",
    search: "Rechercher",
    filter: "Filtrer",
    export: "Exporter",
    import: "Importer",
    back: "Retour",
    next: "Suivant",
    previous: "Precedent",
    skip: "Passer",
    confirm: "Confirmer",
    close: "Fermer",
    refresh: "Actualiser",
    download: "Telecharger",
    upload: "Envoyer",
    send: "Envoyer",
    call: "Appeler",
    whatsapp: "WhatsApp",
    sms: "SMS",
    email: "Email",
  },
  common: {
    loading: "Chargement...",
    noData: "Aucune donnee",
    error: "Erreur",
    success: "Succes",
    welcome: "Bienvenue",
    logout: "Deconnexion",
    profile: "Profil",
    name: "Nom",
    phone: "Telephone",
    status: "Statut",
    date: "Date",
    type: "Type",
    price: "Prix",
    agent: "Agent",
    client: "Client",
    property: "Bien",
    project: "Projet",
    visit: "Visite",
    task: "Tache",
    all: "Tous",
  },
  pipeline: {
    new: "Accueil",
    contacted: "Contacte",
    qualified: "Qualifie",
    visitScheduled: "Visite a gerer",
    visited: "Visite terminee",
    negotiation: "Negociation",
    reserved: "Reservation",
    signed: "Vente",
    closed: "Cloture",
  },
};

// ============================================================================
// Arabe classique
// ============================================================================

const ar: ITranslations = {
  nav: {
    dashboard: "لوحة التحكم",
    pipeline: "مسار المبيعات",
    clients: "العملاء",
    planning: "التخطيط",
    projects: "المشاريع",
    portfolio: "المحفظة",
    map: "الخريطة",
    owners: "الملاك",
    mandates: "التوكيلات",
    commissions: "العمولات",
    automations: "الأتمتة",
    ai: "المساعد الذكي",
    objectives: "الأهداف",
    performance: "الأداء",
    documents: "المستندات",
    notifications: "الإشعارات",
    settings: "الإعدادات",
    auditLog: "السجل",
    cadastre: "السجل العقاري",
    portalManager: "بوابة العميل",
    payments: "المدفوعات",
  },
  sections: {
    principal: "الرئيسي",
    promotion: "الترويج العقاري",
    agency: "الوكالة",
    tools: "الأدوات",
    admin: "الإدارة",
  },
  actions: {
    create: "إنشاء",
    edit: "تعديل",
    delete: "حذف",
    save: "حفظ",
    cancel: "إلغاء",
    search: "بحث",
    filter: "تصفية",
    export: "تصدير",
    import: "استيراد",
    back: "رجوع",
    next: "التالي",
    previous: "السابق",
    skip: "تخطي",
    confirm: "تأكيد",
    close: "إغلاق",
    refresh: "تحديث",
    download: "تحميل",
    upload: "رفع",
    send: "إرسال",
    call: "اتصال",
    whatsapp: "واتساب",
    sms: "رسالة",
    email: "بريد",
  },
  common: {
    loading: "جاري التحميل...",
    noData: "لا توجد بيانات",
    error: "خطأ",
    success: "نجاح",
    welcome: "مرحبا",
    logout: "تسجيل الخروج",
    profile: "الملف الشخصي",
    name: "الاسم",
    phone: "الهاتف",
    status: "الحالة",
    date: "التاريخ",
    type: "النوع",
    price: "السعر",
    agent: "الوكيل",
    client: "العميل",
    property: "العقار",
    project: "المشروع",
    visit: "الزيارة",
    task: "المهمة",
    all: "الكل",
  },
  pipeline: {
    new: "ا��تقبال",
    contacted: "تم الاتصال",
    qualified: "مؤهل",
    visitScheduled: "زيارة مبرمجة",
    visited: "تمت الزيارة",
    negotiation: "مفاوضة",
    reserved: "محجوز",
    signed: "بيع",
    closed: "مغلق",
  },
};

// ============================================================================
// Anglais
// ============================================================================

const en: ITranslations = {
  nav: {
    dashboard: "Dashboard",
    pipeline: "Pipeline",
    clients: "Clients",
    planning: "Planning",
    projects: "Projects",
    portfolio: "Portfolio",
    map: "Map",
    owners: "Owners",
    mandates: "Mandates",
    commissions: "Commissions",
    automations: "Automations",
    ai: "AI Assistant",
    objectives: "Objectives",
    performance: "Performance",
    documents: "Documents",
    notifications: "Notifications",
    settings: "Settings",
    auditLog: "Audit Log",
    cadastre: "Cadastre",
    portalManager: "Client Portal",
    payments: "Payments",
  },
  sections: {
    principal: "Main",
    promotion: "Promotion",
    agency: "Agency",
    tools: "Tools",
    admin: "Administration",
  },
  actions: {
    create: "Create",
    edit: "Edit",
    delete: "Delete",
    save: "Save",
    cancel: "Cancel",
    search: "Search",
    filter: "Filter",
    export: "Export",
    import: "Import",
    back: "Back",
    next: "Next",
    previous: "Previous",
    skip: "Skip",
    confirm: "Confirm",
    close: "Close",
    refresh: "Refresh",
    download: "Download",
    upload: "Upload",
    send: "Send",
    call: "Call",
    whatsapp: "WhatsApp",
    sms: "SMS",
    email: "Email",
  },
  common: {
    loading: "Loading...",
    noData: "No data",
    error: "Error",
    success: "Success",
    welcome: "Welcome",
    logout: "Log out",
    profile: "Profile",
    name: "Name",
    phone: "Phone",
    status: "Status",
    date: "Date",
    type: "Type",
    price: "Price",
    agent: "Agent",
    client: "Client",
    property: "Property",
    project: "Project",
    visit: "Visit",
    task: "Task",
    all: "All",
  },
  pipeline: {
    new: "New",
    contacted: "Contacted",
    qualified: "Qualified",
    visitScheduled: "Visit Scheduled",
    visited: "Visited",
    negotiation: "Negotiation",
    reserved: "Reserved",
    signed: "Signed",
    closed: "Closed",
  },
};

// ============================================================================
// Dictionnaire complet
// ============================================================================

const DICTIONARIES: Record<Locale, ITranslations> = { fr, ar, en };

/**
 * Retourne le dictionnaire de traductions pour une locale donnee.
 */
export function getDictionary(locale: Locale): ITranslations {
  return DICTIONARIES[locale] ?? DICTIONARIES.fr;
}
