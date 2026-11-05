import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  updateDoc,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, sanitizeFirestorePayload } from '../firebase/config';
import { Department } from '../types';

export const INITIAL_DEPARTMENTS: Department[] = [];

const LOCAL_STORAGE_KEY = 'gk_hotel_departments_cache_v2';

function getLocalDepartments(): Department[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Department[];
  } catch {
    return [];
  }
}

function saveLocalDepartments(depts: Department[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(depts));
  } catch (err) {
    console.warn('Failed to save departments to localStorage:', err);
  }
}

export class DepartmentService {
  /**
   * Fetches all departments from Firestore with localStorage fallback
   */
  static async getDepartments(): Promise<Department[]> {
    const path = 'departments';
    try {
      const snap = await getDocs(collection(db, path));
      const list: Department[] = [];

      for (const d of snap.docs) {
        list.push(d.data() as Department);
      }

      const sorted = list.sort((a, b) => a.name.localeCompare(b.name));
      saveLocalDepartments(sorted);
      return sorted;
    } catch (error) {
      console.warn('Firestore error in getDepartments, using cached copy:', error);
      const local = getLocalDepartments();
      if (local.length > 0) {
        return local;
      }
      handleFirestoreError(error, OperationType.LIST, path);
    }
  }

  /**
   * Create new department with immediate local persistence and Firestore write
   */
  static async createDepartment(data: Omit<Department, 'createdAt' | 'updatedAt'>): Promise<Department> {
    const path = `departments/${data.id}`;
    const newDept: Department = {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Update local cache optimistically
    const current = getLocalDepartments();
    const updated = [...current.filter((d) => d.id !== newDept.id), newDept];
    saveLocalDepartments(updated);

    try {
      const sanitized = sanitizeFirestorePayload(newDept);
      await setDoc(doc(db, 'departments', data.id), sanitized);
      return sanitized as Department;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  }

  /**
   * Update department
   */
  static async updateDepartment(id: string, updates: Partial<Department>): Promise<void> {
    const path = `departments/${id}`;
    const current = getLocalDepartments();
    const updated = current.map((d) =>
      d.id === id ? { ...d, ...updates, updatedAt: new Date().toISOString() } : d
    );
    saveLocalDepartments(updated);

    try {
      const sanitized = sanitizeFirestorePayload({
        ...updates,
        updatedAt: new Date().toISOString(),
      });
      await updateDoc(doc(db, 'departments', id), sanitized);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }

  /**
   * Delete department
   */
  static async deleteDepartment(id: string): Promise<void> {
    const path = `departments/${id}`;
    const current = getLocalDepartments();
    saveLocalDepartments(current.filter((d) => d.id !== id));

    try {
      await deleteDoc(doc(db, 'departments', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }
}
