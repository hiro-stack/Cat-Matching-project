from rest_framework import serializers
from .models import Favorite
from cats.serializers import CatListSerializer


class FavoriteSerializer(serializers.ModelSerializer):
    """お気に入りシリアライザー（詳細情報付き）"""
    cat_detail = CatListSerializer(source='cat', read_only=True)

    class Meta:
        model = Favorite
        fields = ['id', 'cat', 'cat_detail', 'created_at']
        read_only_fields = ['id', 'created_at']


class FavoriteCreateSerializer(serializers.ModelSerializer):
    """お気に入り追加用シリアライザー"""

    class Meta:
        model = Favorite
        fields = ['cat']

    def validate_cat(self, value):
        """猫が公開されているか確認"""
        if not value.is_public:
            raise serializers.ValidationError("この猫は現在公開されていません。")
        if value.status != 'open':
            raise serializers.ValidationError("この猫は里親募集を終了しています。")
        return value

    def create(self, validated_data):
        # リクエストユーザーを自動設定
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)
