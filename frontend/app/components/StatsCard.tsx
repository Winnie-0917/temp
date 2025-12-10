interface StatsCardProps {
  title: string;
  value: number;
  icon: string;
  color: 'blue' | 'yellow' | 'green' | 'purple';
}

export default function StatsCard({ title, value, icon, color }: StatsCardProps) {
  const colorConfig = {
    blue: {
      bg: 'from-blue-50 to-cyan-50',
      border: 'border-blue-200/50',
      text: 'text-blue-600',
      accent: 'from-blue-500 to-cyan-500',
    },
    yellow: {
      bg: 'from-amber-50 to-yellow-50',
      border: 'border-amber-200/50',
      text: 'text-amber-600',
      accent: 'from-amber-500 to-yellow-500',
    },
    green: {
      bg: 'from-emerald-50 to-teal-50',
      border: 'border-emerald-200/50',
      text: 'text-emerald-600',
      accent: 'from-emerald-500 to-teal-500',
    },
    purple: {
      bg: 'from-purple-50 to-pink-50',
      border: 'border-purple-200/50',
      text: 'text-purple-600',
      accent: 'from-purple-500 to-pink-500',
    },
  };

  const config = colorConfig[color];
  const displayValue = typeof value === 'number' ? value : 0;

  return (
    <div className={`
      relative overflow-hidden rounded-2xl border ${config.border}
      bg-gradient-to-br ${config.bg} p-6
      card-hover group
    `}>
      {/* 背景裝飾 */}
      <div className={`
        absolute -right-4 -top-4 w-24 h-24 rounded-full
        bg-gradient-to-br ${config.accent} opacity-10
        group-hover:opacity-20 transition-opacity duration-300
      `}></div>
      
      <div className="relative flex items-center justify-between">
        <div>
          <p className={`text-xs font-semibold ${config.text} uppercase tracking-wider mb-1`}>
            {title}
          </p>
          <p className="text-4xl font-bold text-slate-800 tabular-nums">
            {displayValue.toLocaleString()}
          </p>
        </div>
        <div className={`
          text-4xl p-3 rounded-xl
          bg-gradient-to-br ${config.accent}
          bg-clip-text text-transparent
          group-hover:scale-110 transition-transform duration-300
        `}>
          {icon}
        </div>
      </div>
    </div>
  );
}
