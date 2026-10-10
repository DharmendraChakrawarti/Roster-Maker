import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Roster, GenerateRosterRequest, UpdateAssignmentsRequest, ContinuityContext } from '../models/models';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RosterService {
  private apiUrl = `${environment.apiUrl}/rosters`;

  constructor(private http: HttpClient) {}

  getAllRosters(managerId?: number): Observable<Roster[]> {
    const params: any = {};
    if (managerId) params.managerId = managerId.toString();
    return this.http.get<Roster[]>(this.apiUrl, { params });
  }

  getRoster(id: number): Observable<Roster> {
    return this.http.get<Roster>(`${this.apiUrl}/${id}`);
  }

  getRosterByMonth(month: number, year: number, managerId?: number): Observable<Roster> {
    const params: any = { month: month.toString(), year: year.toString() };
    if (managerId) params.managerId = managerId.toString();
    return this.http.get<Roster>(`${this.apiUrl}/by-month`, { params });
  }

  getContinuityContext(month: number, year: number, managerId?: number): Observable<ContinuityContext> {
    const params: any = { month: month.toString(), year: year.toString() };
    if (managerId) params.managerId = managerId.toString();
    return this.http.get<ContinuityContext>(`${this.apiUrl}/continuity-context`, { params });
  }

  generateRoster(request: GenerateRosterRequest): Observable<Roster> {
    return this.http.post<Roster>(`${this.apiUrl}/generate`, request);
  }

  updateAssignments(rosterId: number, request: UpdateAssignmentsRequest): Observable<Roster> {
    return this.http.put<Roster>(`${this.apiUrl}/${rosterId}/assignments`, request);
  }

  finalizeRoster(rosterId: number): Observable<Roster> {
    return this.http.put<Roster>(`${this.apiUrl}/${rosterId}/finalize`, {});
  }

  exportToExcel(rosterId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${rosterId}/export`, {
      responseType: 'blob'
    });
  }

  deleteRoster(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
