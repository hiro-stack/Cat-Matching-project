"""
猫のメイン画像を修正するマネジメントコマンド
"""
from django.core.management.base import BaseCommand
from cats.models import Cat, CatImage


class Command(BaseCommand):
    help = 'Fix primary images for cats without a primary image'

    def handle(self, *args, **options):
        cats = Cat.objects.all()
        fixed_count = 0

        for cat in cats:
            # メイン画像が存在するか確認
            primary_images = cat.images.filter(is_primary=True)

            if primary_images.count() == 0:
                # メイン画像がない場合、最初の画像をメインに設定
                first_image = cat.images.order_by('created_at').first()
                if first_image:
                    first_image.is_primary = True
                    first_image.save()
                    self.stdout.write(
                        self.style.SUCCESS(f'✓ {cat.name} (ID:{cat.id}): 最初の画像をメインに設定しました')
                    )
                    fixed_count += 1
                else:
                    self.stdout.write(
                        self.style.WARNING(f'⚠ {cat.name} (ID:{cat.id}): 画像がありません')
                    )
            elif primary_images.count() > 1:
                # メイン画像が複数ある場合、最初の1枚以外を解除
                for img in primary_images.order_by('created_at')[1:]:
                    img.is_primary = False
                    img.save()
                self.stdout.write(
                    self.style.SUCCESS(f'✓ {cat.name} (ID:{cat.id}): 重複したメイン画像を修正しました')
                )
                fixed_count += 1
            else:
                # メイン画像が正しく設定されている
                self.stdout.write(
                    self.style.SUCCESS(f'✓ {cat.name} (ID:{cat.id}): メイン画像OK')
                )

        self.stdout.write(
            self.style.SUCCESS(f'\n合計 {fixed_count} 匹の猫の画像設定を修正しました')
        )
