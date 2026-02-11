from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from .models import Favorite
from .serializers import FavoriteSerializer, FavoriteCreateSerializer
from cats.models import Cat


class FavoriteViewSet(viewsets.ModelViewSet):
    """お気に入り管理ViewSet"""

    permission_classes = [IsAuthenticated]
    serializer_class = FavoriteSerializer

    def get_queryset(self):
        # ログインユーザーのお気に入りのみ取得
        return Favorite.objects.filter(user=self.request.user).select_related('cat', 'cat__shelter')

    def get_serializer_class(self):
        if self.action == 'create':
            return FavoriteCreateSerializer
        return FavoriteSerializer

    def create(self, request, *args, **kwargs):
        """お気に入りに追加"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # 既にお気に入り登録されているか確認
        cat_id = serializer.validated_data['cat'].id
        existing = Favorite.objects.filter(user=request.user, cat_id=cat_id).first()

        if existing:
            return Response(
                {"detail": "既にお気に入りに登録されています。"},
                status=status.HTTP_200_OK
            )

        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    @action(detail=False, methods=['post'], url_path='toggle')
    def toggle(self, request):
        """お気に入りのトグル（追加/削除）"""
        cat_id = request.data.get('cat')

        if not cat_id:
            return Response(
                {"cat": ["この項目は必須です。"]},
                status=status.HTTP_400_BAD_REQUEST
            )

        cat = get_object_or_404(Cat, id=cat_id)
        favorite = Favorite.objects.filter(user=request.user, cat=cat).first()

        if favorite:
            # 既に存在する場合は削除
            favorite.delete()
            return Response(
                {"detail": "お気に入りから削除しました。", "is_favorited": False},
                status=status.HTTP_200_OK
            )
        else:
            # 存在しない場合は追加
            serializer = FavoriteCreateSerializer(
                data={'cat': cat_id},
                context={'request': request}
            )
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(
                {"detail": "お気に入りに追加しました。", "is_favorited": True},
                status=status.HTTP_201_CREATED
            )

    @action(detail=False, methods=['get'], url_path='check/(?P<cat_id>[^/.]+)')
    def check(self, request, cat_id=None):
        """指定した猫がお気に入り登録されているか確認"""
        is_favorited = Favorite.objects.filter(
            user=request.user,
            cat_id=cat_id
        ).exists()
        return Response({"is_favorited": is_favorited})
