"""
快速診斷：檢查訓練資料問題
"""
import os
import glob

print("=" * 60)
print("檢查訓練資料資料夾")
print("=" * 60)

class_map = {'good': 0, 'normal': 1, 'bad': 2}

for class_name, class_id in class_map.items():
    folder = f'{class_name}_input_movid'
    print(f"\n資料夾: {folder}")
    
    if not os.path.exists(folder):
        print(f"  ❌ 資料夾不存在")
        print(f"  請建立資料夾: mkdir {folder}")
        continue
    
    video_files = glob.glob(os.path.join(folder, '*.mp4')) + \
                  glob.glob(os.path.join(folder, '*.avi')) + \
                  glob.glob(os.path.join(folder, '*.MOV')) + \
                  glob.glob(os.path.join(folder, '*.mov'))
    
    if len(video_files) == 0:
        print(f"  ⚠️  資料夾是空的（沒有影片）")
        print(f"  請將影片放入此資料夾")
    else:
        print(f"  ✅ 找到 {len(video_files)} 個影片")
        print(f"  範例檔案:")
        for i, vf in enumerate(video_files[:3]):
            size_mb = os.path.getsize(vf) / (1024 * 1024)
            print(f"    {i+1}. {os.path.basename(vf)} ({size_mb:.2f} MB)")
        if len(video_files) > 3:
            print(f"    ... 還有 {len(video_files) - 3} 個影片")

print("\n" + "=" * 60)
print("總結")
print("=" * 60)

total = sum([
    len(glob.glob(os.path.join(f'{class_name}_input_movid', '*.mp4')) + \
        glob.glob(os.path.join(f'{class_name}_input_movid', '*.avi')) + \
        glob.glob(os.path.join(f'{class_name}_input_movid', '*.MOV')) + \
        glob.glob(os.path.join(f'{class_name}_input_movid', '*.mov')))
    for class_name in class_map.keys()
    if os.path.exists(f'{class_name}_input_movid')
])

print(f"總影片數量: {total}")

if total == 0:
    print("\n⚠️  警告：沒有找到任何訓練資料！")
    print("\n請按照以下步驟操作:")
    print("1. 在 backend/ 目錄下建立三個資料夾:")
    print("   - good_input_movid")
    print("   - normal_input_movid")
    print("   - bad_input_movid")
    print("\n2. 將對應的影片放入各資料夾:")
    print("   - 優良動作影片 → good_input_movid/")
    print("   - 一般動作影片 → normal_input_movid/")
    print("   - 不良動作影片 → bad_input_movid/")
    print("\n3. 每個資料夾至少放 30 個影片")
    print("   支援格式: .mp4, .avi, .MOV")
elif total < 90:
    print(f"\n⚠️  建議：至少需要 90 個影片（每類 30 個）")
    print(f"   目前只有 {total} 個")
else:
    print(f"\n✅ 資料充足，可以開始訓練！")

print("=" * 60)
