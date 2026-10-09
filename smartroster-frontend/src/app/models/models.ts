export interface Employee {
  id?: number;
  name: string;
  active?: boolean;
}

export interface ShiftConfig {
  id?: number;
  shiftName: string;
  weekdayCount: number;
  weekendCount: number;
  displayOrder?: number;
  colorCode?: string;
  active?: boolean;
}

export interface GenerateRosterRequest {
  month: number;
  year: number;
  weeklyOffPerEmployee?: number;
}

export interface RosterAssignment {
  id?: number;
  employeeId: number;
  employeeName: string;
  assignmentDate: string;
  shiftName: string | null;
  isWeeklyOff: boolean;
  isManualEdit: boolean;
  dayOfWeek: string;
}

export interface EmployeeShiftSummary {
  employeeName: string;
  shiftCounts: { [key: string]: number };
  totalWeeklyOffs: number;
  totalAssignments: number;
}

export interface Roster {
  id?: number;
  month: number;
  year: number;
  status: string;
  weeklyOffPerEmployee: number;
  assignments?: RosterAssignment[];
  warnings?: string[];
  employeeSummary?: { [key: string]: EmployeeShiftSummary };
}

export interface AssignmentUpdate {
  assignmentId?: number;
  employeeId?: number;
  assignmentDate?: string;
  shiftName?: string | null;
  isWeeklyOff?: boolean;
}

export interface UpdateAssignmentsRequest {
  updates: AssignmentUpdate[];
}
