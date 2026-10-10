import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { User, AuthResponse, CreateUserRequest } from '../models/auth.models';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private tokenKey = 'smartroster_token';
  private userKey = 'smartroster_user';

  private currentUserSubject = new BehaviorSubject<User | null>(this.getStoredUser());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {}

  public get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  public get token(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  public get isLoggedIn(): boolean {
    return !!this.token && !!this.currentUser;
  }

  public get isAdmin(): boolean {
    const user = this.currentUser;
    return !!user && user.role === 'ADMIN';
  }

  public get isManager(): boolean {
    const user = this.currentUser;
    return !!user && user.role === 'MANAGER';
  }

  public get isStaff(): boolean {
    const user = this.currentUser;
    return !!user && user.role === 'USER';
  }

  public get canManageRoster(): boolean {
    const user = this.currentUser;
    return !!user && (user.role === 'ADMIN' || user.role === 'MANAGER');
  }

  getManagers(): Observable<import('../models/auth.models').ManagerSummary[]> {
    return this.http.get<import('../models/auth.models').ManagerSummary[]>(`${this.apiUrl}/managers`);
  }

  login(username: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, { username, password }).pipe(
      tap((res) => {
        if (res.token && res.user) {
          this.setSession(res.token, res.user);
        }
      })
    );
  }

  register(request: CreateUserRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, request).pipe(
      tap((res) => {
        if (res.token && res.user) {
          this.setSession(res.token, res.user);
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  private setSession(token: string, user: User): void {
    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.userKey, JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  private getStoredUser(): User | null {
    try {
      const stored = localStorage.getItem(this.userKey);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  getAuthHeaders(): { [header: string]: string } {
    const token = this.token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
}
