import os
import django

# Djangoの設定を読み込む
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from cats.models import CatImage, CatVideo
from django.core.files.storage import default_storage

def check_and_clean():
    print("Checking for corrupted data on Heroku...")
    deleted_items = []

    # 1. 存在しない画像ファイルを持つCatImageをチェック
    print("Checking CatImages...")
    for img in CatImage.objects.all():
        try:
            if not img.image or not default_storage.exists(img.image.name):
                msg = f"Deleted CatImage (ID: {img.id}, Cat: {img.cat.name}) - Missing file: {img.image.name if img.image else 'None'}"
                print(msg)
                deleted_items.append(msg)
                img.delete()
        except Exception as e:
            print(f"Error checking CatImage {img.id}: {e}")

    # 2. 存在しない動画ファイルを持つCatVideoをチェック
    print("Checking CatVideos...")
    for vid in CatVideo.objects.all():
        try:
            if not vid.video or not default_storage.exists(vid.video.name):
                msg = f"Deleted CatVideo (ID: {vid.id}, Cat: {vid.cat.name}) - Missing file: {vid.video.name if vid.video else 'None'}"
                print(msg)
                deleted_items.append(msg)
                vid.delete()
        except Exception as e:
            print(f"Error checking CatVideo {vid.id}: {e}")

    print("\n" + "="*50)
    print(f"Total items deleted: {len(deleted_items)}")
    print("="*50)
    
    return deleted_items

if __name__ == "__main__":
    check_and_clean()
