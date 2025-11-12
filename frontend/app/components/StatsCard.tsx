interface StatsCardProps {
  title: string;
  value: number;
  icon: string;
  color: 'blue' | 'yellow' | 'green' | 'purple';
}

export default function StatsCard({ title, value, icon, color }: StatsCardProps) {
  const colorClasses = {
    blue: 'from-blue-400 to-cyan-500',
    yellow: 'from-amber-400 to-yellow-500',
    green: 'from-emerald-400 to-teal-500',
    purple: 'from-purple-400 to-pink-500',
  };

  return (
    <div className="group bg-white/80 backdrop-blur-sm rounded-2xl border border-orange-200/50 p-6 transition-all duration-300 hover:border-orange-300 hover:shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-orange-600/70 uppercase tracking-wider mb-2">
            {title}
          </p>
          <p className="text-3xl font-semibold text-orange-900 tabular-nums">
            {value}
          </p>
        </div>
        <div className={`text-4xl opacity-80 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br ${colorClasses[color]} bg-clip-text text-transparent`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
