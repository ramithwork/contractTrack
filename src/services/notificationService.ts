import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  deleteDoc,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import { Contract, ContractNotification, User } from '../types';

export class NotificationService {
  /**
   * Request notification permission from browser/OS
   */
  static async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('Notifications not supported by browser.');
      return 'denied';
    }
    if (Notification.permission === 'granted') {
      return 'granted';
    }
    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch (e) {
      console.error('Error requesting notification permission:', e);
      return 'denied';
    }
  }

  /**
   * Check if notifications are granted
   */
  static isPermissionGranted(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted';
  }

  /**
   * Dispatches a Desktop / Mobile native notification via Service Worker (works even when tab is backgrounded)
   */
  static async showNativeNotification(title: string, options: NotificationOptions = {}) {
    const defaultOptions = {
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      tag: 'gk-contract-reminder',
      renotify: true,
      ...options,
    };

    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        if (registration && 'showNotification' in registration) {
          await registration.showNotification(title, defaultOptions);
          return;
        }
      }
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, defaultOptions);
      }
    } catch (err) {
      console.warn('Could not fire native notification:', err);
    }
  }

  /**
   * Evaluates contracts and generates/dispatches reminders for the logged-in user
   * (creator or assigned user)
   */
  static async evaluateAndSendContractReminders(
    currentUser: User,
    contracts: Contract[]
  ): Promise<ContractNotification[]> {
    if (!currentUser || !contracts || contracts.length === 0) return [];

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const relevantContracts = contracts.filter((c) => {
      const isCreator = c.creatorId === currentUser.id;
      const isAssigned = Array.isArray(c.assignedUserIds) && c.assignedUserIds.includes(currentUser.id);
      return (isCreator || isAssigned) && c.status === 'active';
    });

    const newNotifications: ContractNotification[] = [];

    for (const contract of relevantContracts) {
      if (!contract.renewalDate) continue;
      const renewal = new Date(contract.renewalDate);
      renewal.setHours(0, 0, 0, 0);

      const diffTime = renewal.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const reminderIntervals = contract.reminderDays && contract.reminderDays.length > 0
        ? contract.reminderDays
        : [90, 60, 30, 14, 7, 1];

      // Check if diffDays matches one of the reminder intervals or is overdue/urgent
      const shouldRemind =
        diffDays <= 0 ||
        reminderIntervals.includes(diffDays) ||
        (diffDays <= 7 && diffDays > 0);

      if (shouldRemind) {
        const notifId = `notif_${contract.id}_${currentUser.id}_${diffDays <= 0 ? 'exp' : diffDays}`;
        const urgencyType =
          diffDays <= 0
            ? 'renewal_urgent'
            : diffDays <= 14
            ? 'renewal_urgent'
            : 'renewal_upcoming';

        const title =
          diffDays < 0
            ? `⚠️ OVERDUE: Contract ${contract.contractNumber}`
            : diffDays === 0
            ? `🔔 RENEWAL TODAY: Contract ${contract.contractNumber}`
            : `⏳ Renewal Reminder: ${contract.title} (${diffDays} days left)`;

        const message =
          diffDays < 0
            ? `Contract with ${contract.vendorName} (${contract.departmentName}) expired on ${contract.renewalDate}. Immediate review required.`
            : `Renewal due on ${contract.renewalDate} for ${contract.vendorName}. Notice period: ${contract.noticePeriodDays} days.`;

        const notifData: ContractNotification = {
          id: notifId,
          userId: currentUser.id,
          contractId: contract.id,
          contractTitle: contract.title,
          contractNumber: contract.contractNumber,
          departmentName: contract.departmentName,
          renewalDate: contract.renewalDate,
          daysRemaining: diffDays,
          type: urgencyType,
          title,
          message,
          read: false,
          createdAt: new Date().toISOString(),
        };

        try {
          // Save to Firestore notifications
          await setDoc(doc(db, 'notifications', notifId), notifData, { merge: true });
          newNotifications.push(notifData);

          // If permission is granted, dispatch desktop/mobile notification
          if (this.isPermissionGranted()) {
            await this.showNativeNotification(title, {
              body: message,
              data: { url: `/contract/${contract.id}` },
            });
          }
        } catch (err) {
          console.warn('Failed to persist notification:', err);
        }
      }
    }

    return newNotifications;
  }

  /**
   * Load notifications for current user
   */
  static async getUserNotifications(userId: string): Promise<ContractNotification[]> {
    const path = 'notifications';
    try {
      const q = query(collection(db, path), where('userId', '==', userId));
      const snapshot = await getDocs(q);
      const items: ContractNotification[] = [];
      snapshot.forEach((d) => {
        items.push(d.data() as ContractNotification);
      });
      // Sort newest first
      return items.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string): Promise<void> {
    const path = `notifications/${notificationId}`;
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: true,
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }

  /**
   * Delete notification
   */
  static async deleteNotification(notificationId: string): Promise<void> {
    const path = `notifications/${notificationId}`;
    try {
      await deleteDoc(doc(db, 'notifications', notificationId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }
}
