export interface User {
  id: string;
  name: string;
  email: string;
  image: string | null;
  ph_no: string | null;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
}

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  paymentId: string | null;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  user: User;
  course: Course;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ApiResponse {
  status: string;
  message: string;
  data: {
    data: Enrollment[];
    pagination: Pagination;
  };
  code: number;
}