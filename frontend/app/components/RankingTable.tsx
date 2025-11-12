interface Player {
  CurrentRank: number;
  PlayerName: string;
  CountryName: string;
  RankingPointsYTD: number;
  PreviousRank?: number;
  RankingDifference?: number;
  IttfId: string;
}

interface RankingTableProps {
  data: Player[];
  category: string;
}

export default function RankingTable({ data, category }: RankingTableProps) {
  const isDoubles = category.includes('DOUBLES');

  const getPlayerPhotoUrl = (ittfId: string, playerName: string) => {
    const encodedName = playerName.replace(/ /g, '%20');
    return `https://photofiles.worldtabletennis.com/wtt-media/photos/400px/${ittfId}_Headshot_R_${encodedName}.png`;
  };

  const getPlayerPhotoUrlWithUnderscore = (ittfId: string, playerName: string) => {
    const encodedName = playerName.replace(/ /g, '_');
    return `https://photofiles.worldtabletennis.com/wtt-media/photos/400px/${ittfId}_Headshot_R_${encodedName}.png`;
  };

  const getRankChange = (current: number, previous?: number) => {
    if (!previous || previous === current) return null;
    const change = previous - current;
    if (change > 0) {
      return <span className="text-emerald-600 text-xs font-medium">↑ {change}</span>;
    } else if (change < 0) {
      return <span className="text-rose-600 text-xs font-medium">↓ {Math.abs(change)}</span>;
    }
    return null;
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-orange-200/50 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="border-b border-orange-200/50 bg-gradient-to-r from-orange-50 to-amber-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-orange-700 uppercase tracking-wider">
                排名
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-orange-700 uppercase tracking-wider">
                {isDoubles ? '選手組合' : '選手'}
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-orange-700 uppercase tracking-wider">
                國家
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-orange-700 uppercase tracking-wider">
                積分
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-orange-700 uppercase tracking-wider">
                變化
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-orange-100">
            {data.map((player, index) => (
              <tr
                key={index}
                className="hover:bg-orange-50/50 transition-colors duration-150"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    {player.CurrentRank <= 3 && (
                      <span className="text-xl">
                        {player.CurrentRank === 1 ? '🥇' : player.CurrentRank === 2 ? '🥈' : '🥉'}
                      </span>
                    )}
                    <span className="text-sm font-semibold text-orange-900 tabular-nums">
                      {player.CurrentRank}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <img
                      src={getPlayerPhotoUrl(player.IttfId, player.PlayerName)}
                      alt={player.PlayerName}
                      className="w-10 h-10 rounded-full object-cover border-2 border-orange-200"
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (!target.dataset.retried) {
                          target.dataset.retried = 'true';
                          target.src = getPlayerPhotoUrlWithUnderscore(player.IttfId, player.PlayerName);
                        } else {
                          target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"%3E%3Ccircle cx="24" cy="24" r="24" fill="%23FED7AA"/%3E%3Cpath d="M24 24c3.3 0 6-2.7 6-6s-2.7-6-6-6-6 2.7-6 6 2.7 6 6 6zm0 3c-4 0-12 2-12 6v3h24v-3c0-4-8-6-12-6z" fill="%23F97316"/%3E%3C/svg%3E';
                        }
                      }}
                    />
                    <span className="text-sm font-medium text-orange-900">
                      {player.PlayerName}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-xs font-medium text-orange-700 bg-orange-100 px-2.5 py-1 rounded-full">
                    {player.CountryName}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-semibold text-orange-900 tabular-nums">
                    {player.RankingPointsYTD?.toLocaleString()}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getRankChange(player.CurrentRank, player.PreviousRank)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
