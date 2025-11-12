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
    <div className="mb-8">
      <div className="flex flex-wrap gap-4">
        {Object.entries(categoryNames).map(([key, name]) => (
          <button
            key={key}
            onClick={() => onCategoryChange(key)}
            className={`px-6 py-3 rounded-lg font-medium transition-all transform hover:scale-105 ${
              selectedCategory === key
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 shadow'
            }`}
          >
            {name}
          </button>
        ))}
      </div>
    </div>
  );
}
