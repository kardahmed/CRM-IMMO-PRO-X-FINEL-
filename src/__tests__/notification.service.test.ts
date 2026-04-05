import { describe, it, expect, vi, beforeEach } from "vitest";

// ============================================================================
// Mocks
// ============================================================================

const mockNotificationCreate = vi.fn();
const mockNotificationCreateMany = vi.fn();
const mockNotificationFindMany = vi.fn();
const mockNotificationCount = vi.fn();
const mockNotificationUpdateMany = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    notification: {
      create: (...args: unknown[]) => mockNotificationCreate(...args),
      createMany: (...args: unknown[]) => mockNotificationCreateMany(...args),
      findMany: (...args: unknown[]) => mockNotificationFindMany(...args),
      count: (...args: unknown[]) => mockNotificationCount(...args),
      updateMany: (...args: unknown[]) => mockNotificationUpdateMany(...args),
    },
    $extends: vi.fn(),
  },
}));

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
  currentUser: vi.fn(),
}));

// ============================================================================
// Imports
// ============================================================================

import {
  createNotification,
  createNotificationBulk,
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from "@/services/notification.service";

// ============================================================================
// Tests
// ============================================================================

describe("Notification Service", () => {
  const TENANT_ID = "tenant-notif-001";
  const USER_ID = "user-001";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createNotification", () => {
    it("cree une notification avec les bons champs", async () => {
      mockNotificationCreate.mockResolvedValue({ id: "notif-001" });

      const result = await createNotification({
        tenantId: TENANT_ID,
        userId: USER_ID,
        title: "Nouveau lead",
        message: "Un lead Facebook est arrive",
        type: "FACEBOOK_LEAD",
        link: "/leads/unassigned",
      });

      expect(result).toBe("notif-001");
      expect(mockNotificationCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId: TENANT_ID,
          userId: USER_ID,
          title: "Nouveau lead",
          type: "FACEBOOK_LEAD",
          isRead: false,
          link: "/leads/unassigned",
        }),
      });
    });

    it("met link a null si non fourni", async () => {
      mockNotificationCreate.mockResolvedValue({ id: "notif-002" });

      await createNotification({
        tenantId: TENANT_ID,
        userId: USER_ID,
        title: "Test",
        message: "Test message",
        type: "INFO",
      });

      expect(mockNotificationCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          link: null,
        }),
      });
    });
  });

  describe("createNotificationBulk", () => {
    it("cree plusieurs notifications via createMany", async () => {
      mockNotificationCreateMany.mockResolvedValue({ count: 2 });

      const inputs = [
        {
          tenantId: TENANT_ID,
          userId: "user-a",
          title: "Lead",
          message: "Msg",
          type: "FACEBOOK_LEAD" as const,
        },
        {
          tenantId: TENANT_ID,
          userId: "user-b",
          title: "Lead",
          message: "Msg",
          type: "FACEBOOK_LEAD" as const,
        },
      ];

      const result = await createNotificationBulk(inputs);

      expect(result).toBe(2);
      expect(mockNotificationCreateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.arrayContaining([
            expect.objectContaining({ userId: "user-a", type: "FACEBOOK_LEAD" }),
            expect.objectContaining({ userId: "user-b", type: "FACEBOOK_LEAD" }),
          ]),
        }),
      );
    });

    it("retourne 0 si tableau vide", async () => {
      const result = await createNotificationBulk([]);
      expect(result).toBe(0);
      expect(mockNotificationCreateMany).not.toHaveBeenCalled();
    });
  });

  describe("getUserNotifications", () => {
    it("retourne les notifications du user dans le tenant", async () => {
      const mockNotifs = [
        {
          id: "n1",
          title: "Test",
          message: "Msg",
          type: "INFO",
          isRead: false,
          link: null,
          createdAt: new Date(),
        },
      ];
      mockNotificationFindMany.mockResolvedValue(mockNotifs);

      const result = await getUserNotifications(TENANT_ID, USER_ID);

      expect(mockNotificationFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: TENANT_ID,
            userId: USER_ID,
          }),
        }),
      );
      expect(result).toEqual(mockNotifs);
    });

    it("filtre les non-lues si onlyUnread est true", async () => {
      mockNotificationFindMany.mockResolvedValue([]);

      await getUserNotifications(TENANT_ID, USER_ID, { onlyUnread: true });

      expect(mockNotificationFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: TENANT_ID,
            userId: USER_ID,
            isRead: false,
          }),
        }),
      );
    });
  });

  describe("getUnreadCount", () => {
    it("retourne le nombre de notifications non lues", async () => {
      mockNotificationCount.mockResolvedValue(5);

      const count = await getUnreadCount(TENANT_ID, USER_ID);

      expect(count).toBe(5);
      expect(mockNotificationCount).toHaveBeenCalledWith({
        where: { tenantId: TENANT_ID, userId: USER_ID, isRead: false },
      });
    });
  });

  describe("markAsRead", () => {
    it("marque une notification comme lue avec filtre userId via updateMany", async () => {
      mockNotificationUpdateMany.mockResolvedValue({ count: 1 });

      await markAsRead(TENANT_ID, "n1", USER_ID);

      expect(mockNotificationUpdateMany).toHaveBeenCalledWith({
        where: { id: "n1", tenantId: TENANT_ID, userId: USER_ID },
        data: { isRead: true },
      });
    });
  });

  describe("markAllAsRead", () => {
    it("marque toutes les notifications du user comme lues", async () => {
      mockNotificationUpdateMany.mockResolvedValue({ count: 3 });

      await markAllAsRead(TENANT_ID, USER_ID);

      expect(mockNotificationUpdateMany).toHaveBeenCalledWith({
        where: { tenantId: TENANT_ID, userId: USER_ID, isRead: false },
        data: { isRead: true },
      });
    });
  });
});
