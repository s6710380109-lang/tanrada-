import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
  active?: boolean;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
  return (
    <nav className="flex items-center text-xs md:text-sm text-slate-500 py-3 px-4 bg-white/70 backdrop-blur-sm border-b border-slate-100 rounded-lg mb-4" aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-2 flex-wrap">
        <li className="inline-flex items-center">
          <button
            onClick={items[0]?.onClick}
            className="inline-flex items-center text-slate-600 hover:text-blue-600 transition-colors cursor-pointer"
          >
            <Home className="w-3.5 h-3.5 mr-1 text-slate-400" />
            หน้าแรก
          </button>
        </li>
        {items.slice(1).map((item, index) => (
          <li key={index} className="inline-flex items-center">
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 mx-1 shrink-0" />
            {item.onClick && !item.active ? (
              <button
                onClick={item.onClick}
                className="text-slate-600 hover:text-blue-600 transition-colors max-w-[200px] truncate cursor-pointer"
              >
                {item.label}
              </button>
            ) : (
              <span className="text-blue-700 font-medium max-w-[250px] truncate" aria-current="page">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};
