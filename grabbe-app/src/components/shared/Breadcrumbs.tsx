import { Link } from 'react-router-dom';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export const Breadcrumbs = ({ items }: BreadcrumbsProps) => {
  return (
    <nav className="flex items-center gap-2 mb-8 text-[10px] font-bold tracking-widest uppercase text-text-muted">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={index} className="flex items-center gap-2">
            {index > 0 && (
              <span className="material-symbols-outlined text-[12px] text-outline-variant">chevron_right</span>
            )}
            {item.path && !isLast ? (
              <Link to={item.path} className="hover:text-primary cursor-pointer transition-colors">
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? 'text-primary' : 'text-text-base'}>
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
};
