"""
共用常數定義
"""

# 排名類別
class RankingCategory:
    SEN_SINGLES = 'SEN_SINGLES'  # 男子單打
    SEN_DOUBLES = 'SEN_DOUBLES'  # 男子雙打
    
    @classmethod
    def all(cls):
        return [cls.SEN_SINGLES, cls.SEN_DOUBLES]
    
    @classmethod
    def display_name(cls, category: str) -> str:
        names = {
            cls.SEN_SINGLES: '男子單打',
            cls.SEN_DOUBLES: '男子雙打',
        }
        return names.get(category, category)


# 動作分析結果類別
class ActionClass:
    GOOD = 'good'       # 優良
    NORMAL = 'normal'   # 一般
    BAD = 'bad'         # 不良
    
    @classmethod
    def all(cls):
        return [cls.GOOD, cls.NORMAL, cls.BAD]
    
    @classmethod
    def display_name(cls, action_class: str) -> str:
        names = {
            cls.GOOD: '優良',
            cls.NORMAL: '一般',
            cls.BAD: '不良',
        }
        return names.get(action_class, action_class)


# 訓練狀態
class TrainingStatus:
    INITIALIZING = 'initializing'
    TRAINING = 'training'
    COMPLETED = 'completed'
    FAILED = 'failed'
    CANCELLED = 'cancelled'


# 支援的影片格式
SUPPORTED_VIDEO_FORMATS = ['mp4', 'avi', 'mov', 'mkv']

# API 端點
class APIEndpoints:
    HEALTH = '/health'
    RANKINGS = '/api/rankings'
    ANALYZE = '/api/analyze'
    TRAIN = '/api/train'
    FAILURE_ANALYSIS = '/api/analyze-failure'
