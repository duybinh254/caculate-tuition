// Kiểu dữ liệu tương ứng với các sheet trong Google Sheet
// (dùng chung cho các trang & API routes ở các giai đoạn sau)

export interface ClassRow {
  classId: string;
  className: string;
  feePerSession: number;
  note?: string;
}

export interface StudentRow {
  studentId: string;
  name: string;
  classId: string;
  parentPhone?: string;
  status: "active" | "inactive";
}

export interface AttendanceRow {
  date: string; // YYYY-MM-DD
  classId: string;
  studentId: string;
  present: boolean;
}

export interface MonthlySummaryRow {
  month: string; // YYYY-MM
  studentId: string;
  classId: string;
  sessionCount: number;
  feePerSession: number;
  totalAmount: number;
  paid: boolean;
}
