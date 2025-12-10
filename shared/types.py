"""
API 回應類型定義
"""
from dataclasses import dataclass
from typing import Dict, List, Optional, Any
from datetime import datetime


@dataclass
class HealthResponse:
    """健康檢查回應"""
    status: str
    message: Optional[str] = None


@dataclass
class RankingPlayer:
    """排名選手資料"""
    rank: int
    name: str
    country: str
    country_code: str
    points: int
    previous_rank: Optional[int] = None
    rank_change: Optional[int] = None


@dataclass
class RankingResponse:
    """排名資料回應"""
    category: str
    total_records: int
    updated_at: str
    players: List[RankingPlayer]


@dataclass
class AnalysisResult:
    """動作分析結果"""
    predicted_class: str
    confidence: float
    probabilities: Dict[str, float]
    filename: str


@dataclass
class TrainingConfig:
    """訓練配置"""
    model_type: str
    epochs: int
    batch_size: int
    learning_rate: float
    data_augmentation: int = 1


@dataclass
class TrainingProgress:
    """訓練進度"""
    status: str
    message: str
    current_epoch: int
    total_epochs: int
    accuracy: Optional[float] = None
    val_accuracy: Optional[float] = None
    loss: Optional[float] = None
    val_loss: Optional[float] = None
    logs: List[str] = None


@dataclass
class FailureAnalysisResult:
    """失誤分析結果"""
    success: bool
    filename: str
    analysis: Dict[str, Any]
    video_path: Optional[str] = None
    error: Optional[str] = None
