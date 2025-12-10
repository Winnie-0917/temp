"""
訓練服務
處理模型訓練的執行和狀態管理
"""
from typing import Dict, Any


class TrainingService:
    """訓練服務類別"""
    
    def __init__(self, task_storage: Dict = None):
        """
        初始化訓練服務
        
        Args:
            task_storage: 訓練任務存儲字典
        """
        self.task_storage = task_storage or {}
    
    def run_training(self, task_id: str, config: Dict[str, Any]) -> None:
        """
        在背景執行訓練任務
        
        Args:
            task_id: 任務 ID
            config: 訓練配置
        """
        try:
            self.task_storage[task_id]['status'] = 'training'
            self.task_storage[task_id]['message'] = '正在準備資料...'
            self.task_storage[task_id]['logs'] = []
            
            # 動態導入訓練腳本
            import train_web
            
            # 執行訓練
            result = train_web.train_model(config, task_id, self.task_storage)
            
            self.task_storage[task_id]['status'] = 'completed'
            self.task_storage[task_id]['result'] = result
            self.task_storage[task_id]['message'] = '訓練完成！'
            
        except Exception as e:
            self.task_storage[task_id]['status'] = 'failed'
            self.task_storage[task_id]['message'] = str(e)
            self.task_storage[task_id]['logs'].append(f"❌ 錯誤: {str(e)}")
    
    def get_task_status(self, task_id: str) -> Dict[str, Any]:
        """
        取得訓練任務狀態
        
        Args:
            task_id: 任務 ID
            
        Returns:
            任務狀態
        """
        if task_id not in self.task_storage:
            return None
        return self.task_storage[task_id]
    
    def cancel_task(self, task_id: str) -> bool:
        """
        取消訓練任務
        
        Args:
            task_id: 任務 ID
            
        Returns:
            是否成功取消
        """
        if task_id in self.task_storage:
            self.task_storage[task_id]['status'] = 'cancelled'
            return True
        return False
