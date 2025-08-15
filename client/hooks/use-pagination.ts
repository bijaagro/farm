import { useState, useMemo } from "react";

export interface PaginationConfig {
  page: number;
  pageSize: number;
  total: number;
}

export interface PaginationResult<T> {
  data: T[];
  pagination: PaginationConfig;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  totalPages: number;
  goToPage: (page: number) => void;
  goToNextPage: () => void;
  goToPreviousPage: () => void;
  changePageSize: (size: number) => void;
}

export function usePagination<T>(
  data: T[],
  initialPageSize: number = 10,
): PaginationResult<T> {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const total = data.length;
  const totalPages = Math.ceil(total / pageSize);

  const paginatedData = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return data.slice(startIndex, endIndex);
  }, [data, page, pageSize]);

  const hasNextPage = page < totalPages;
  const hasPreviousPage = page > 1;

  const goToPage = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const goToNextPage = () => {
    if (hasNextPage) {
      setPage(page + 1);
    }
  };

  const goToPreviousPage = () => {
    if (hasPreviousPage) {
      setPage(page - 1);
    }
  };

  const changePageSize = (size: number) => {
    setPageSize(size);
    setPage(1); // Reset to first page when changing page size
  };

  return {
    data: paginatedData,
    pagination: {
      page,
      pageSize,
      total,
    },
    hasNextPage,
    hasPreviousPage,
    totalPages,
    goToPage,
    goToNextPage,
    goToPreviousPage,
    changePageSize,
  };
}
