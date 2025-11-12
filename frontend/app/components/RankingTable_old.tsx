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
    // 將空格轉換為 %20
    const encodedName = playerName.replace(/ /g, '%20');
    return `https://photofiles.worldtabletennis.com/wtt-media/photos/400px/${ittfId}_Headshot_R_${encodedName}.png`;
  };

  const getPlayerPhotoUrlWithUnderscore = (ittfId: string, playerName: string) => {
    // 將空格轉換為 _
    const encodedName = playerName.replace(/ /g, '_');
    return `https://photofiles.worldtabletennis.com/wtt-media/photos/400px/${ittfId}_Headshot_R_${encodedName}.png`;
  };

  const getRankChange = (current: number, previous?: number) => {
    if (!previous || previous === current) return null;
    const change = previous - current;
    if (change > 0) {
      return <span className="text-green-600 dark:text-green-400">↑ {change}</span>;
    } else if (change < 0) {
      return <span className="text-red-600 dark:text-red-400">↓ {Math.abs(change)}</span>;
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                排名
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {isDoubles ? '選手組合' : '選手'}
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                國家/地區
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                積分
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                變化
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {data.map((player, index) => (
              <tr
                key={index}
                className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {player.CurrentRank <= 3 ? (
                      <span className="text-2xl mr-2">
                        {player.CurrentRank === 1 ? '🥇' : player.CurrentRank === 2 ? '🥈' : '🥉'}
                      </span>
                    ) : null}
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      {player.CurrentRank}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <img
                      src={getPlayerPhotoUrl(player.IttfId, player.PlayerName)}
                      alt={player.PlayerName}
                      className="w-12 h-12 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
                      onError={(e) => {
                        const target = e.currentTarget;
                        // 第一次錯誤:嘗試用底線代替空格
                        if (!target.dataset.retried) {
                          target.dataset.retried = 'true';
                          target.src = getPlayerPhotoUrlWithUnderscore(player.IttfId, player.PlayerName);
                        } else {
                          // 第二次錯誤:顯示預設頭像
                          target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"%3E%3Ccircle cx="24" cy="24" r="24" fill="%23E5E7EB"/%3E%3Cpath d="M24 24c3.3 0 6-2.7 6-6s-2.7-6-6-6-6 2.7-6 6 2.7 6 6 6zm0 3c-4 0-12 2-12 6v3h24v-3c0-4-8-6-12-6z" fill="%239CA3AF"/%3E%3C/svg%3E';
                        }
                      }}
                    />
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {player.PlayerName}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    {player.CountryName}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-semibold">
                  {player.RankingPointsYTD?.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
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
