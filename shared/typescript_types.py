"""
前端共用類型定義 (TypeScript)
這個檔案可以被複製到前端專案使用
"""

TYPESCRIPT_TYPES = '''
// ==============================================
// Table Tennis AI - 共用類型定義
// ==============================================

// 排名類別
export type RankingCategory = 'SEN_SINGLES' | 'SEN_DOUBLES';

export const RANKING_CATEGORY_NAMES: Record<RankingCategory, string> = {
  SEN_SINGLES: '男子單打',
  SEN_DOUBLES: '男子雙打',
};

// 動作分類
export type ActionClass = 'good' | 'normal' | 'bad';

export const ACTION_CLASS_NAMES: Record<ActionClass, string> = {
  good: '優良',
  normal: '一般',
  bad: '不良',
};

// 訓練狀態
export type TrainingStatus = 
  | 'initializing' 
  | 'training' 
  | 'completed' 
  | 'failed' 
  | 'cancelled';

// API 回應類型
export interface HealthResponse {
  status: string;
  message?: string;
}

export interface RankingPlayer {
  rank: number;
  name: string;
  country: string;
  countryCode: string;
  points: number;
  previousRank?: number;
  rankChange?: number;
}

export interface RankingResponse {
  category: RankingCategory;
  totalRecords: number;
  updatedAt: string;
  players: RankingPlayer[];
}

export interface AnalysisResult {
  predicted_class: ActionClass;
  confidence: number;
  probabilities: Record<ActionClass, number>;
  filename: string;
}

export interface TrainingConfig {
  model_type: string;
  epochs: number;
  batch_size: number;
  learning_rate: number;
  data_augmentation?: number;
}

export interface TrainingProgress {
  status: TrainingStatus;
  message: string;
  current_epoch: number;
  total_epochs: number;
  accuracy?: number;
  val_accuracy?: number;
  loss?: number;
  val_loss?: number;
  logs: string[];
}

export interface FailureAnalysisResult {
  success: boolean;
  filename: string;
  analysis: Record<string, any>;
  video_path?: string;
  error?: string;
}

// API 端點
export const API_ENDPOINTS = {
  HEALTH: '/health',
  RANKINGS: '/api/rankings',
  ANALYZE: '/api/analyze',
  TRAIN: '/api/train',
  FAILURE_ANALYSIS: '/api/analyze-failure',
} as const;
'''

def generate_typescript_file(output_path: str = None):
    """生成 TypeScript 類型定義檔案"""
    if output_path:
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(TYPESCRIPT_TYPES)
    return TYPESCRIPT_TYPES

if __name__ == '__main__':
    print(TYPESCRIPT_TYPES)
