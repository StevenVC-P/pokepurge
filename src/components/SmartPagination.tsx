import React from "react";

interface SmartPaginationProps {
  currentPage: number;
  totalPages: number;
  perPage: number;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
}

export const SmartPagination: React.FC<SmartPaginationProps> = ({
  currentPage,
  totalPages,
  perPage,
  onPageChange,
  onPerPageChange,
}) => {
  const getPageNumbers = (): (number | "...")[] => {
    const pages: (number | "...")[] = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 4) pages.push("...");

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);

      if (currentPage < totalPages - 3) pages.push("...");
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className="flex flex-col md:flex-row justify-between items-center gap-4 py-4">
      {/* Items per page selector */}
      <div className="flex items-center gap-2">
        <label htmlFor="perPage" className="text-sm text-gray-700">
          Show:
        </label>
        <select
          id="perPage"
          value={perPage}
          onChange={(e) => onPerPageChange(Number(e.target.value))}
          className="border rounded px-2 py-1 text-sm"
        >
          {[10, 25, 50, 100].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>

      {/* Pagination controls */}
      <div className="flex items-center flex-wrap gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-2 py-1 border rounded disabled:opacity-50"
        >
          Prev
        </button>

        {getPageNumbers().map((page, index) =>
            page === "..." ? (
                <span key={`ellipsis-${index}`} className="px-2 text-gray-400">
                ...
                </span>
            ) : (
                <button
                key={`page-${page}`}
                onClick={() => onPageChange(page)}
                className={`px-2 py-1 rounded border ${
                    page === currentPage ? "bg-blue-600 text-white" : ""
                }`}
                >
                {page}
                </button>
            )
        )}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-2 py-1 border rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
};
