interface CategorySelectorProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  categoryNames: { [key: string]: string };
}

export default function CategorySelector({
  selectedCategory,
  onCategoryChange,
  categoryNames,
}: CategorySelectorProps) {
  return (
    <div className="inline-flex bg-white/80 backdrop-blur-sm rounded-xl p-1.5 border border-orange-200/30 shadow-sm">
      {Object.entries(categoryNames).map(([key, name]) => (
        <button
          key={key}
          onClick={() => onCategoryChange(key)}
          className={`
            px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200
            ${selectedCategory === key
              ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-md'
              : 'text-slate-600 hover:text-orange-600 hover:bg-orange-50'
            }
          `}
        >
          {name}
        </button>
      ))}
    </div>
  );
}
