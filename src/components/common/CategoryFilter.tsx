import React from 'react';
import { LucideIcon } from 'lucide-react';
interface Category {
id: string;
label: string;
icon: LucideIcon;
}
interface CategoryFilterProps {
categories: Category[];
selectedCategory: string;
onCategoryChange: (category: string) => void;
activeColor?: string;
inactiveColor?: string;
}
const CategoryFilter: React.FC<CategoryFilterProps> = ({
categories,
selectedCategory,
onCategoryChange,
activeColor = "bg-[#1a4a3a]",
inactiveColor = "bg-[#f5e6d3]"
}) => {
return (
<div className="flex justify-center gap-2 md:gap-3 px-4">
{categories.map((category) => {
const Icon = category.icon;
const isActive = selectedCategory === category.id;
    return (
      <button
        key={category.id}
        onClick={() => onCategoryChange(category.id)}
        className={`px-4 md:px-6 lg:px-8 py-3 md:py-4 rounded-2xl text-sm md:text-base font-medium transition-all flex items-center flex-1 max-w-[200px] justify-center ${
          isActive
            ? `${activeColor} text-white shadow-lg transform scale-105`
            : `${inactiveColor} text-[#1a4a3a] hover:${activeColor} hover:text-white`
        }`}
      >
        <Icon size={18} className="mr-1 md:mr-2 flex-shrink-0" />
        {category.label}
      </button>
    );
  })}
</div>
);
};
export default CategoryFilter;