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
  
  // 安全檢查：確保 data 是陣列
  if (!data || !Array.isArray(data)) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <p className="text-gray-400">暫無數據</p>
      </div>
    );
  }

  // 生成頭像 URL - 方案 1: 空格轉 %20
  const getPlayerPhotoUrl = (ittfId: string, playerName: string) => {
    const encodedName = playerName.replace(/ /g, '%20');
    return `https://photofiles.worldtabletennis.com/wtt-media/photos/400px/${ittfId}_Headshot_R_${encodedName}.png`;
  };

  // 生成頭像 URL - 方案 2: 空格轉 _
  const getPlayerPhotoUrlWithUnderscore = (ittfId: string, playerName: string) => {
    const encodedName = playerName.replace(/ /g, '_');
    return `https://photofiles.worldtabletennis.com/wtt-media/photos/400px/${ittfId}_Headshot_R_${encodedName}.png`;
  };

  // 生成頭像 URL - 方案 3: HEADSHOT 大寫
  const getPlayerPhotoUrlUppercase = (ittfId: string, playerName: string) => {
    const encodedName = playerName.replace(/ /g, '_');
    return `https://photofiles.worldtabletennis.com/wtt-media/photos/400px/${ittfId}_HEADSHOT_R_${encodedName}.png`;
  };

  // 生成頭像 URL - 方案 4: 名字前後對調 (Hugo CALDERANO -> CALDERANO_Hugo)
  const getPlayerPhotoUrlReversed = (ittfId: string, playerName: string) => {
    const parts = playerName.split(' ');
    if (parts.length >= 2) {
      // 反轉名字順序：Hugo CALDERANO -> CALDERANO Hugo
      const reversedName = `${parts[1]}_${parts[0]}`;
      return `https://photofiles.worldtabletennis.com/wtt-media/photos/400px/${ittfId}_Headshot_R_${reversedName}.png`;
    }
    return getPlayerPhotoUrl(ittfId, playerName);
  };

  // 生成頭像 URL - 方案 5: 中間的連字符 - 轉成 _ (LIN Yun-Ju -> LIN_Yun_Ju)
  const getPlayerPhotoUrlHyphenToUnderscore = (ittfId: string, playerName: string) => {
    const encodedName = playerName.replace(/ /g, '_').replace(/-/g, '_');
    return `https://photofiles.worldtabletennis.com/wtt-media/photos/400px/${ittfId}_Headshot_R_${encodedName}.png`;
  };

  // 生成頭像 URL - 方案 6: 第一個空格轉 _, 後面空格轉 %20 (LEE Sang Su -> LEE_Sang%20Su)
  const getPlayerPhotoUrlMixedEncoding = (ittfId: string, playerName: string) => {
    const parts = playerName.split(' ');
    if (parts.length >= 2) {
      // 第一個空格轉 _, 其餘空格轉 %20
      const firstName = parts[0];
      const restName = parts.slice(1).join('%20');
      const encodedName = `${firstName}_${restName}`;
      return `https://photofiles.worldtabletennis.com/wtt-media/photos/400px/${ittfId}_Headshot_R_${encodedName}.png`;
    }
    return getPlayerPhotoUrl(ittfId, playerName);
  };

  // 生成頭像 URL - 方案 7: 全小寫 (LEE Sang Su -> lee_sang_su)
  const getPlayerPhotoUrlLowercase = (ittfId: string, playerName: string) => {
    const encodedName = playerName.toLowerCase().replace(/ /g, '_').replace(/-/g, '_');
    return `https://photofiles.worldtabletennis.com/wtt-media/photos/400px/${ittfId}_Headshot_R_${encodedName}.png`;
  };

  // SVG 預設頭像
  const getDefaultAvatar = () => {
    return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"%3E%3Ccircle cx="24" cy="24" r="24" fill="%23FED7AA"/%3E%3Cpath d="M24 24c3.3 0 6-2.7 6-6s-2.7-6-6-6-6 2.7-6 6 2.7 6 6 6zm0 3c-4 0-12 2-12 6v3h24v-3c0-4-8-6-12-6z" fill="%23F97316"/%3E%3C/svg%3E';
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
                        const retry = target.dataset.retry || '0';
                        
                        if (retry === '0') {
                          // 第一次失敗：嘗試空格轉底線
                          target.dataset.retry = '1';
                          target.src = getPlayerPhotoUrlWithUnderscore(player.IttfId, player.PlayerName);
                        } else if (retry === '1') {
                          // 第二次失敗：嘗試 HEADSHOT 大寫
                          target.dataset.retry = '2';
                          target.src = getPlayerPhotoUrlUppercase(player.IttfId, player.PlayerName);
                        } else if (retry === '2') {
                          // 第三次失敗：嘗試名字前後對調
                          target.dataset.retry = '3';
                          target.src = getPlayerPhotoUrlReversed(player.IttfId, player.PlayerName);
                        } else if (retry === '3') {
                          // 第四次失敗：嘗試連字符轉底線 (LIN Yun-Ju -> LIN_Yun_Ju)
                          target.dataset.retry = '4';
                          target.src = getPlayerPhotoUrlHyphenToUnderscore(player.IttfId, player.PlayerName);
                        } else if (retry === '4') {
                          // 第五次失敗：嘗試混合編碼 (LEE Sang Su -> LEE_Sang%20Su)
                          target.dataset.retry = '5';
                          target.src = getPlayerPhotoUrlMixedEncoding(player.IttfId, player.PlayerName);
                        } else if (retry === '5') {
                          // 第六次失敗：嘗試全小寫
                          target.dataset.retry = '6';
                          target.src = getPlayerPhotoUrlLowercase(player.IttfId, player.PlayerName);
                        } else {
                          // 所有方案都失敗：使用預設頭像
                          target.dataset.retry = '7';
                          target.src = getDefaultAvatar();
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
