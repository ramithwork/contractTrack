import {
  collection,
  doc,
  getDocs,
  setDoc,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import { ActivityLog, User } from '../types';

export class ActivityLogService {
  /**
   * Record an activity in the audit trail
   */
  static async log(
    user: User,
    action: ActivityLog['action'],
    details: string,
    targetId: string = ''
  ): Promise<void> {
    const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const logEntry: ActivityLog = {
      id: logId,
      userId: user.id,
      userName: user.displayName || user.username,
      userRole: user.role,
      departmentId: user.departmentId || '',
      departmentName: user.departmentName || '',
      action,
      details,
      targetId,
      timestamp: new Date().toISOString(),
    };

    const path = `activity_logs/${logId}`;
    try {
      await setDoc(doc(db, 'activity_logs', logId), logEntry);
    } catch (error) {
      console.warn('Activity log record note:', error);
      // Non-blocking for UI operations
    }
  }

  /**
   * Fetch all logs (newest first)
   */
  static async getAllLogs(maxLimit: number = 200): Promise<ActivityLog[]> {
    const path = 'activity_logs';
    try {
      const snap = await getDocs(collection(db, path));
      const logs: ActivityLog[] = [];
      snap.forEach((d) => logs.push(d.data() as ActivityLog));
      return logs
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, maxLimit);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  }

  /**
   * Fetch logs for a specific user
   */
  static async getLogsByUser(userId: string): Promise<ActivityLog[]> {
    const path = 'activity_logs';
    try {
      const q = query(collection(db, path), where('userId', '==', userId));
      const snap = await getDocs(q);
      const logs: ActivityLog[] = [];
      snap.forEach((d) => logs.push(d.data() as ActivityLog));
      return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  }

  /**
   * Fetch logs for a department
   */
  static async getLogsByDepartment(departmentId: string): Promise<ActivityLog[]> {
    const path = 'activity_logs';
    try {
      const q = query(collection(db, path), where('departmentId', '==', departmentId));
      const snap = await getDocs(q);
      const logs: ActivityLog[] = [];
      snap.forEach((d) => logs.push(d.data() as ActivityLog));
      return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  }
}
