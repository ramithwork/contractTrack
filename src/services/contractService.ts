import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, sanitizeFirestorePayload } from '../firebase/config';
import { Contract, ContractUrgency, User } from '../types';
import { ActivityLogService } from './activityLogService';

export const INITIAL_SAMPLE_CONTRACTS: Omit<Contract, 'createdAt' | 'updatedAt'>[] = [];

// Old sample IDs to clean up from Firestore
const SAMPLE_CONTRACT_IDS = [
  'ct_otis_lifts',
  'ct_ceylon_tea_fnb',
  'ct_diversey_hk',
  'ct_opera_pms',
  'ct_royal_security',
  'ct_dialog_fiber',
];

export class ContractService {
  /**
   * Fetches contracts from Firestore, removing any legacy sample data
   */
  static async getContracts(): Promise<Contract[]> {
    const path = 'contracts';
    try {
      const snap = await getDocs(collection(db, path));
      const list: Contract[] = [];

      for (const d of snap.docs) {
        if (SAMPLE_CONTRACT_IDS.includes(d.id)) {
          // Clean legacy sample record
          deleteDoc(doc(db, path, d.id)).catch(() => {});
        } else {
          list.push(d.data() as Contract);
        }
      }

      return list.sort(
        (a, b) => new Date(a.renewalDate).getTime() - new Date(b.renewalDate).getTime()
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  }

  /**
   * Creates a new contract with activity audit logging
   */
  static async createContract(
    data: Omit<Contract, 'id' | 'createdAt' | 'updatedAt'>,
    currentUser: User
  ): Promise<Contract> {
    const newId = `ct_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newContract: Contract = {
      ...data,
      id: newId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const path = `contracts/${newId}`;
    try {
      const sanitized = sanitizeFirestorePayload(newContract);
      await setDoc(doc(db, 'contracts', newId), sanitized);

      // Log activity without committed spend
      await ActivityLogService.log(
        currentUser,
        'CONTRACT_CREATED',
        `Registered new contract '${newContract.title}' (${newContract.contractNumber}) for ${newContract.departmentName}. Vendor: ${newContract.vendorName}.`,
        newId
      );

      return sanitized as Contract;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  }

  /**
   * Updates an existing contract
   */
  static async updateContract(
    id: string,
    updates: Partial<Contract>,
    currentUser: User
  ): Promise<void> {
    const path = `contracts/${id}`;
    const payload = sanitizeFirestorePayload({
      ...updates,
      updatedAt: new Date().toISOString(),
    });

    try {
      await updateDoc(doc(db, 'contracts', id), payload);

      const action = updates.status === 'renewed' ? 'CONTRACT_RENEWED' : 'CONTRACT_UPDATED';
      await ActivityLogService.log(
        currentUser,
        action,
        `Updated contract details for ID '${id}'. Fields modified: ${Object.keys(updates).join(', ')}`,
        id
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }

  /**
   * Delete contract (Admin only)
   */
  static async deleteContract(id: string, contractTitle: string, currentUser: User): Promise<void> {
    const path = `contracts/${id}`;
    try {
      await deleteDoc(doc(db, 'contracts', id));
      await ActivityLogService.log(
        currentUser,
        'CONTRACT_DELETED',
        `Permanently deleted contract record '${contractTitle}' (ID: ${id})`,
        id
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  /**
   * Computes days remaining and urgency status for a renewal date
   */
  static calculateUrgency(renewalDateStr: string): ContractUrgency {
    if (!renewalDateStr) {
      return {
        daysRemaining: 999,
        level: 'good_standing',
        badgeLabel: 'Active',
        colorClass: 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30',
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const renewal = new Date(renewalDateStr);
    renewal.setHours(0, 0, 0, 0);

    const diffMs = renewal.getTime() - today.getTime();
    const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (daysRemaining < 0) {
      return {
        daysRemaining,
        level: 'overdue',
        badgeLabel: `${Math.abs(daysRemaining)}d Overdue`,
        colorClass: 'bg-rose-950/60 text-rose-300 border-rose-500/40 font-bold animate-pulse',
      };
    }
    if (daysRemaining <= 14) {
      return {
        daysRemaining,
        level: 'urgent',
        badgeLabel: daysRemaining === 0 ? 'Due Today' : `${daysRemaining}d Left (Urgent)`,
        colorClass: 'bg-amber-950/60 text-amber-300 border-amber-500/40 font-semibold',
      };
    }
    if (daysRemaining <= 60) {
      return {
        daysRemaining,
        level: 'upcoming',
        badgeLabel: `${daysRemaining}d Left`,
        colorClass: 'bg-sky-950/50 text-sky-300 border-sky-500/30',
      };
    }
    return {
      daysRemaining,
      level: 'good_standing',
      badgeLabel: `${daysRemaining}d Remaining`,
      colorClass: 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30',
    };
  }
}
