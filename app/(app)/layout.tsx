import NavBar from "@/components/NavBar";

/**
 * Layout dùng chung cho các trang chính (Tổng quan/Lớp học/Học sinh/Điểm danh/Học phí).
 * NavBar nằm ở đây (không phải trong từng page) để không bị mất/chớp khi chuyển trang —
 * khi điều hướng, chỉ phần nội dung con (children) tải lại, NavBar giữ nguyên vị trí.
 */
export default function AppGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      {children}
    </div>
  );
}
