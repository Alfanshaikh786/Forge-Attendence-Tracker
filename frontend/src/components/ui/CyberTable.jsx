import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

/**
 * CyberTable - A table component with cyber ops styling and animations
 * 
 * @param {Object} props
 * @param {Array} props.columns - Column definitions [{key, label}]
 * @param {Array} props.data - Row data
 * @param {Function} props.onRowClick - Row click handler
 * @param {Function} props.renderCell - Custom cell renderer
 * @param {boolean} props.selectable - Enable row selection
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element}
 */
export const CyberTable = ({
  columns,
  data,
  onRowClick,
  renderCell,
  selectable = false,
  className = '',
}) => {
  const tableRef = useRef(null);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const rowRefs = useRef({});

  useEffect(() => {
    // Animate rows on mount
    Object.values(rowRefs.current).forEach((row, index) => {
      if (row) {
        gsap.fromTo(
          row,
          { opacity: 0, x: -10 },
          {
            opacity: 1,
            x: 0,
            duration: 0.4,
            delay: index * 0.05,
            ease: 'power2.out',
          }
        );
      }
    });
  }, [data]);

  const handleRowHover = (e, index) => {
    const row = rowRefs.current[index];
    if (!row) return;

    if (e.type === 'mouseenter') {
      gsap.to(row, {
        backgroundColor: 'rgba(0, 255, 65, 0.08)',
        boxShadow: '0 0 15px rgba(0, 255, 65, 0.2), inset 0 0 20px rgba(0, 255, 65, 0.05)',
        duration: 0.2,
        ease: 'power2.out',
      });
      gsap.to(row, {
        scale: 1.01,
        duration: 0.2,
        ease: 'power2.out',
      });
    } else {
      gsap.to(row, {
        backgroundColor: 'transparent',
        boxShadow: 'none',
        duration: 0.2,
        ease: 'power2.out',
      });
      gsap.to(row, {
        scale: 1,
        duration: 0.2,
        ease: 'power2.out',
      });
    }
  };

  const handleRowSelect = (index) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedRows(newSelected);
  };

  const handleCellClick = (e, rowData, index) => {
    if (selectable) {
      e.stopPropagation();
      handleRowSelect(index);
    }
    onRowClick?.(rowData, index);
  };

  return (
    <div
      ref={tableRef}
      className={`overflow-hidden rounded-lg border border-cyber-border bg-cyber-card ${className}`}
    >
      <table className="w-full text-sm font-mono">
        <thead>
          <tr className="border-b border-cyber-border bg-cyber-surface/50">
            {selectable && (
              <th className="w-12 px-4 py-3 text-left">
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-cyber-neon"
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedRows(new Set(data.map((_, i) => i)));
                    } else {
                      setSelectedRows(new Set());
                    }
                  }}
                />
              </th>
            )}
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-4 py-3 text-left text-cyber-neon uppercase tracking-wider font-semibold"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              ref={(el) => (rowRefs.current[rowIndex] = el)}
              onMouseEnter={(e) => handleRowHover(e, rowIndex)}
              onMouseLeave={(e) => handleRowHover(e, rowIndex)}
              className={`
                border-b border-cyber-border/30 cursor-pointer
                transition-all duration-200 hover:border-cyber-border
                ${selectedRows.has(rowIndex) ? 'bg-cyber-neon/10' : ''}
              `}
              onClick={(e) => handleCellClick(e, row, rowIndex)}
            >
              {selectable && (
                <td className="px-4 py-3 w-12">
                  <input
                    type="checkbox"
                    checked={selectedRows.has(rowIndex)}
                    onChange={() => handleRowSelect(rowIndex)}
                    className="w-4 h-4 accent-cyber-neon"
                    onClick={(e) => e.stopPropagation()}
                  />
                </td>
              )}
              {columns.map((col) => (
                <td
                  key={`${rowIndex}-${col.key}`}
                  className="px-4 py-3 text-cyber-text"
                >
                  {renderCell ? (
                    renderCell(row[col.key], col.key, row, rowIndex)
                  ) : (
                    <span>{row[col.key]}</span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CyberTable;
