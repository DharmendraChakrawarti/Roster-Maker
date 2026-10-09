import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ShiftConfig } from '../models/models';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ShiftConfigService {
  private apiUrl = `${environment.apiUrl}/shift-configs`;

  constructor(private http: HttpClient) {}

  getShiftConfigs(activeOnly: boolean = true): Observable<ShiftConfig[]> {
    const params = new HttpParams().set('activeOnly', activeOnly.toString());
    return this.http.get<ShiftConfig[]>(this.apiUrl, { params });
  }

  getShiftConfig(id: number): Observable<ShiftConfig> {
    return this.http.get<ShiftConfig>(`${this.apiUrl}/${id}`);
  }

  createShiftConfig(config: ShiftConfig): Observable<ShiftConfig> {
    return this.http.post<ShiftConfig>(this.apiUrl, config);
  }

  updateShiftConfig(id: number, config: ShiftConfig): Observable<ShiftConfig> {
    return this.http.put<ShiftConfig>(`${this.apiUrl}/${id}`, config);
  }

  deleteShiftConfig(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
