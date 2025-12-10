'use client';

import React, { useState, useEffect } from 'react';

interface PlayerProfile {
    player_id: string;
    display_name: string;
    aliases?: string[];
    avatar_url?: string;
    aggregate_ratings?: {
        serve?: number;
        receive?: number;
        attack?: number;
        defense?: number;
        tactics?: number;
    };
    match_history?: Array<{
        match_id: string;
        video_id: string;
        opponent: string;
        date: string;
        result: string;
        ratings?: any;
        strengths?: any[];
        weaknesses?: any[];
    }>;
    total_matches?: number;
    last_updated?: string;
}

interface PlayerProfileCardProps {
    playerName: string;
    onClose: () => void;
}

export default function PlayerProfileCard({ playerName, onClose }: PlayerProfileCardProps) {
    const [profile, setProfile] = useState<PlayerProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                setLoading(true);
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
                const response = await fetch(`${apiUrl}/api/players/profile/${encodeURIComponent(playerName)}`);
                const data = await response.json();

                if (data.success) {
                    setProfile(data.profile);
                } else {
                    setError(data.error || '無法載入選手資料');
                }
            } catch (err) {
                setError('連線錯誤');
            } finally {
                setLoading(false);
            }
        };

        if (playerName) {
            fetchProfile();
        }
    }, [playerName]);

    const getRatingColor = (value: number) => {
        if (value >= 8) return 'bg-green-500';
        if (value >= 6) return 'bg-blue-500';
        if (value >= 4) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
                    <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
                <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
                    <div className="text-center">
                        <p className="text-neutral-500 mb-4">{error || '找不到選手資料'}</p>
                        <p className="text-sm text-neutral-400">此選手尚未有分析紀錄</p>
                        <button
                            onClick={onClose}
                            className="mt-4 px-4 py-2 bg-neutral-900 text-white rounded-lg text-sm"
                        >
                            關閉
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
            <div
                className="bg-white rounded-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-t-2xl text-white relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-white/70 hover:text-white"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    <div className="flex items-center gap-4">
                        <div className="w-20 h-20 rounded-full bg-white/20 border-4 border-white/30 flex items-center justify-center text-3xl font-bold overflow-hidden">
                            {profile.avatar_url ? (
                                <img
                                    src={profile.avatar_url}
                                    alt={profile.display_name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                />
                            ) : (
                                profile.display_name.charAt(0)
                            )}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">{profile.display_name}</h2>
                            {(profile as any).country && (
                                <p className="text-white/80 text-sm mb-1">
                                    🌏 {(profile as any).country}
                                </p>
                            )}
                            <p className="text-white/70 text-sm">
                                已分析 {profile.total_matches || 0} 場比賽
                            </p>
                        </div>
                    </div>
                </div>

                {/* Aggregate Ratings */}
                {profile.aggregate_ratings && Object.keys(profile.aggregate_ratings).length > 0 && (
                    <div className="p-6 border-b border-neutral-100">
                        <h3 className="text-sm font-bold text-neutral-700 mb-4">📊 綜合能力評分</h3>
                        <div className="space-y-3">
                            {[
                                { label: '發球', key: 'serve' },
                                { label: '接發球', key: 'receive' },
                                { label: '進攻', key: 'attack' },
                                { label: '防守', key: 'defense' },
                                { label: '戰術', key: 'tactics' }
                            ].map(({ label, key }) => {
                                const value = profile.aggregate_ratings?.[key as keyof typeof profile.aggregate_ratings];
                                return (
                                    <div key={key} className="flex items-center gap-3">
                                        <span className="w-16 text-sm text-neutral-600">{label}</span>
                                        <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${getRatingColor(value || 0)}`}
                                                style={{ width: `${(value || 0) * 10}%` }}
                                            ></div>
                                        </div>
                                        <span className="w-10 text-sm font-medium text-neutral-700 text-right">
                                            {value?.toFixed(1) || '-'}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Match History */}
                <div className="p-6">
                    <h3 className="text-sm font-bold text-neutral-700 mb-4">🏆 比賽紀錄</h3>

                    {profile.match_history && profile.match_history.length > 0 ? (
                        <div className="space-y-3">
                            {profile.match_history.slice(0, 10).map((match, idx) => (
                                <div
                                    key={match.match_id || idx}
                                    className="p-4 bg-neutral-50 rounded-xl hover:bg-neutral-100 transition-colors"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-medium text-neutral-900">
                                            vs {match.opponent}
                                        </span>
                                        <span className={`text-xs px-2 py-1 rounded-full ${match.result === '勝' ? 'bg-green-100 text-green-700' :
                                            match.result === '負' ? 'bg-red-100 text-red-700' :
                                                'bg-neutral-200 text-neutral-600'
                                            }`}>
                                            {match.result}
                                        </span>
                                    </div>
                                    <div className="text-xs text-neutral-400">
                                        {match.date}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-neutral-400 text-center py-8">
                            尚無比賽紀錄
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
