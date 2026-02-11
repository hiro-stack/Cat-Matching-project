from django.db import models
from django.contrib.auth import get_user_model
from cats.models import Cat

User = get_user_model()


class Favorite(models.Model):
    """お気に入り（ユーザーと猫の多対多関係）"""

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='favorites',
        verbose_name='ユーザー'
    )
    cat = models.ForeignKey(
        Cat,
        on_delete=models.CASCADE,
        related_name='favorited_by',
        verbose_name='猫'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='お気に入り登録日時'
    )

    class Meta:
        verbose_name = 'お気に入り'
        verbose_name_plural = 'お気に入り'
        # ユーザーと猫の組み合わせは一意
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'cat'],
                name='unique_user_cat_favorite'
            )
        ]
        # 新しいお気に入りを上に表示
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['cat']),
        ]

    def __str__(self):
        return f"{self.user.username} → {self.cat.name}"
