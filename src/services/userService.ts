import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  updateDoc,
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType, sanitizeFirestorePayload } from '../firebase/config';
import { User, UserRole } from '../types';

// Password hashing helper for internal username/password authentication
export async function hashPassword(plainText: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plainText + '_GK_HOTEL_SALT_2026');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export const INITIAL_USERS: (Omit<User, 'createdAt' | 'updatedAt'> & { defaultPasswordPlain: string })[] = [
  {
    id: 'user_it_admin',
    username: 'it@grandkandyan.com',
    email: 'it@grandkandyan.com',
    displayName: 'IT Administrator',
    role: 'admin',
    departmentId: 'dept-it',
    departmentName: 'IT & Digital Systems',
    phoneNumber: '+94 81 450 0000',
    status: 'active',
    defaultPasswordPlain: 'gkr2014gr',
  },
];

const SAMPLE_USER_IDS = ['user_admin', 'user_fnb_mgr', 'user_eng_officer', 'user_hk_officer'];
const CURRENT_USER_KEY = 'gk_hotel_current_user_v1';

export class UserService {
  /**
   * Initializes users in Firestore, ensuring only it@grandkandyan.com and custom users are kept
   */
  static async initializeUsers(): Promise<User[]> {
    const path = 'users';
    try {
      const snap = await getDocs(collection(db, path));
      const users: User[] = [];

      for (const d of snap.docs) {
        if (SAMPLE_USER_IDS.includes(d.id)) {
          // Purge legacy demo account
          deleteDoc(doc(db, path, d.id)).catch(() => {});
          deleteDoc(doc(db, 'admins', d.id)).catch(() => {});
        } else {
          users.push(d.data() as User);
        }
      }

      // Check if it@grandkandyan.com is already present
      const adminExists = users.some(
        (u) => u.username.toLowerCase() === 'it@grandkandyan.com' || u.email?.toLowerCase() === 'it@grandkandyan.com'
      );

      if (!adminExists) {
        const hash = await hashPassword('gkr2014gr');
        const adminDoc: User = {
          id: 'user_it_admin',
          username: 'it@grandkandyan.com',
          email: 'it@grandkandyan.com',
          displayName: 'IT Administrator',
          role: 'admin',
          departmentId: 'dept-it',
          departmentName: 'IT & Digital Systems',
          phoneNumber: '+94 81 450 0000',
          status: 'active',
          passwordHash: hash,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await setDoc(doc(db, 'users', adminDoc.id), adminDoc);
        await setDoc(doc(db, 'admins', adminDoc.id), {
          id: adminDoc.id,
          username: adminDoc.username,
          displayName: adminDoc.displayName,
          role: 'admin',
        });
        users.push(adminDoc);
      }

      return users.sort((a, b) => a.displayName.localeCompare(b.displayName));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  }

  /**
   * Fetch all users
   */
  static async getAllUsers(): Promise<User[]> {
    const path = 'users';
    try {
      const snap = await getDocs(collection(db, path));
      const users: User[] = [];
      snap.forEach((d) => users.push(d.data() as User));

      // Fallback check to ensure admin is included
      if (!users.some((u) => u.username.toLowerCase() === 'it@grandkandyan.com')) {
        const hash = await hashPassword('gkr2014gr');
        users.push({
          id: 'user_it_admin',
          username: 'it@grandkandyan.com',
          email: 'it@grandkandyan.com',
          displayName: 'IT Administrator',
          role: 'admin',
          departmentId: 'dept-it',
          departmentName: 'IT & Digital Systems',
          phoneNumber: '+94 81 450 0000',
          status: 'active',
          passwordHash: hash,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      return users.sort((a, b) => a.displayName.localeCompare(b.displayName));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  }

  /**
   * Authenticate user using username and password
   */
  static async authenticate(username: string, plainPassword: string): Promise<User | null> {
    const cleanUsername = username.trim().toLowerCase();

    // Check directly for admin override credentials
    if (cleanUsername === 'it@grandkandyan.com' && plainPassword === 'gkr2014gr') {
      const hash = await hashPassword('gkr2014gr');
      const adminUser: User = {
        id: 'user_it_admin',
        username: 'it@grandkandyan.com',
        email: 'it@grandkandyan.com',
        displayName: 'IT Administrator',
        role: 'admin',
        departmentId: 'dept-it',
        departmentName: 'IT & Digital Systems',
        phoneNumber: '+94 81 450 0000',
        status: 'active',
        passwordHash: hash,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      // Persist in background
      setDoc(doc(db, 'users', adminUser.id), adminUser).catch(() => {});
      setDoc(doc(db, 'admins', adminUser.id), { id: adminUser.id, role: 'admin' }).catch(() => {});
      this.setCurrentUser(adminUser);
      return adminUser;
    }

    const users = await this.getAllUsers();
    const targetUser = users.find(
      (u) => u.username.toLowerCase() === cleanUsername || u.email?.toLowerCase() === cleanUsername
    );

    if (!targetUser) {
      throw new Error('User not found. Please verify your username.');
    }

    if (targetUser.status !== 'active') {
      throw new Error('This account has been deactivated. Contact an administrator.');
    }

    const computedHash = await hashPassword(plainPassword);
    if (targetUser.passwordHash && targetUser.passwordHash !== computedHash) {
      throw new Error('Incorrect password. Please try again.');
    }

    this.setCurrentUser(targetUser);
    return targetUser;
  }

  /**
   * Save active user to local session
   */
  static setCurrentUser(user: User | null): void {
    if (!user) {
      localStorage.removeItem(CURRENT_USER_KEY);
    } else {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    }
  }

  /**
   * Retrieve active user from local session
   */
  static getCurrentUser(): User | null {
    const stored = localStorage.getItem(CURRENT_USER_KEY);
    if (!stored) return null;
    try {
      return JSON.parse(stored) as User;
    } catch {
      return null;
    }
  }

  /**
   * Admin-only: Create user
   */
  static async createUser(
    userData: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'passwordHash'> & {
      plainPassword?: string;
    }
  ): Promise<User> {
    const newId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const hash = await hashPassword(userData.plainPassword || 'GrandKandyan@2026');
    const newUser: User = {
      id: newId,
      username: userData.username.trim().toLowerCase(),
      email: userData.email ? userData.email.trim().toLowerCase() : '',
      displayName: userData.displayName.trim(),
      role: userData.role,
      departmentId: userData.departmentId,
      departmentName: userData.departmentName,
      phoneNumber: userData.phoneNumber?.trim() || '',
      status: userData.status || 'active',
      passwordHash: hash,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const path = `users/${newId}`;
    try {
      const sanitized = sanitizeFirestorePayload(newUser);
      await setDoc(doc(db, 'users', newId), sanitized);
      if (newUser.role === 'admin') {
        await setDoc(doc(db, 'admins', newId), {
          id: newId,
          role: 'admin',
        });
      }
      return sanitized as User;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  }

  /**
   * Admin-only: Update user
   */
  static async updateUser(
    id: string,
    updates: Partial<User> & { plainPassword?: string }
  ): Promise<void> {
    const path = `users/${id}`;
    const payload: Partial<User> = { ...updates };
    if (updates.plainPassword) {
      payload.passwordHash = await hashPassword(updates.plainPassword);
      delete (payload as { plainPassword?: string }).plainPassword;
    }
    payload.updatedAt = new Date().toISOString();

    try {
      const sanitizedPayload = sanitizeFirestorePayload(payload);
      await updateDoc(doc(db, 'users', id), sanitizedPayload);
      if (updates.role) {
        if (updates.role === 'admin') {
          await setDoc(doc(db, 'admins', id), { id, role: 'admin' }, { merge: true });
        } else {
          try {
            await deleteDoc(doc(db, 'admins', id));
          } catch {
            // Document might not exist in admins
          }
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }

  /**
   * Admin-only: Delete user
   */
  static async deleteUser(id: string): Promise<void> {
    const path = `users/${id}`;
    try {
      await deleteDoc(doc(db, 'users', id));
      try {
        await deleteDoc(doc(db, 'admins', id));
      } catch {
        // Safe ignore
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }
}
