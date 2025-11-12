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
    <div className="flex gap-3">
      {Object.entries(categoryNames).map(([key, name]) => (
        <button
          key={key}
          onClick={() => onCategoryChange(key)}
          className={`px-6 py-3 rounded-full text-sm font-medium transition-all duration-200 shadow-sm ${
            selectedCategory === key
              ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md hover:shadow-lg'
              : 'bg-white/80 backdrop-blur-sm border border-orange-200/50 text-orange-700 hover:border-orange-300 hover:bg-orange-50'
          }`}
        >
          {name}
        </button>
      ))}
    </div>
  );
}
