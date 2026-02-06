from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.serializers import ValidationError
from rest_framework.parsers import MultiPartParser, FormParser
from django.db.models import Q
from rest_framework.exceptions import PermissionDenied
from .models import Cat, CatImage, CatVideo
from shelters.models import ShelterUser
from .serializers import (
    CatListSerializer,
    CatDetailSerializer,
    CatCreateUpdateSerializer,
    CatImageSerializer,
    CatVideoSerializer
)


class IsShelterMemberOrReadOnly(permissions.BasePermission):
    """保護団体メンバーのみ編集可能（所属チェック付き）"""
    
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_authenticated and request.user.user_type == 'shelter'
    
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # オブジェクトのShelterに所属しているかチェック
        return ShelterUser.objects.filter(
            user=request.user,
            shelter=obj.shelter,
            is_active=True
        ).exists()


class CatListCreateView(generics.ListCreateAPIView):
    """保護猫一覧・作成API"""
    
    permission_classes = [IsShelterMemberOrReadOnly]
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CatCreateUpdateSerializer
        return CatListSerializer
    
    def get_queryset(self):
        queryset = Cat.objects.all()
        
        # 検索フィルター
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(breed__icontains=search) |
                Q(color__icontains=search) |
                Q(personality__icontains=search)
            )

        # フィルター: 性別
        gender = self.request.query_params.get('gender', None)
        if gender:
             queryset = queryset.filter(gender=gender)

        # フィルター: 年齢 (範囲指定)
        min_age = self.request.query_params.get('min_age', None)
        max_age = self.request.query_params.get('max_age', None)
        
        if min_age is not None:
             queryset = queryset.filter(age_years__gte=min_age)
        if max_age is not None:
             queryset = queryset.filter(age_years__lte=max_age)

        # ステータスフィルター
        cat_status = self.request.query_params.get('status', None)
        
        # 未認証ユーザー（一般公開）は status パラメータを無視し、'available' 固定
        if not self.request.user.is_authenticated:
            queryset = queryset.filter(status='available')
        elif cat_status:
            # 認証ユーザー（保護団体・管理者）のみステータス指定可能
            queryset = queryset.filter(status=cat_status)
        else:
            # 認証ユーザーで指定なしの場合も、デフォルトは 'available' とする（安全側）
            # もし管理画面等で全件出したい場合は ?status= などをフロントで制御するか、
            # 別途「全件取得用」パラメータを用意するが、ここはシンプルに。
            queryset = queryset.filter(status='available')
        
        return queryset.order_by('-created_at')
    
    def perform_create(self, serializer):
        user = self.request.user
        
        # 所属する有効な保護団体を取得
        # 1ユーザー1団体前提（adminロール優先等の要件があれば調整）
        shelter_user = ShelterUser.objects.filter(
            user=user, 
            is_active=True
        ).first()

        if not shelter_user:
            raise ValidationError("有効な保護団体に所属していないため、猫を登録できません。")
            
        serializer.save(shelter=shelter_user.shelter)


class CatDetailView(generics.RetrieveUpdateDestroyAPIView):
    """保護猫詳細・更新・削除API"""
    
    queryset = Cat.objects.all()
    # ShelterUser経由の権限チェックを適用
    permission_classes = [IsShelterMemberOrReadOnly]
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return CatCreateUpdateSerializer
        return CatDetailSerializer


class CatImageUploadView(generics.CreateAPIView):
    """保護猫画像アップロードAPI"""
    
    queryset = CatImage.objects.all()
    serializer_class = CatImageSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    def create(self, request, *args, **kwargs):
        cat_id = kwargs.get('cat_id')
        user = request.user
        
        # 権限チェック: この猫のShelterに所属しているか？
        try:
            cat = Cat.objects.get(id=cat_id)
        except Cat.DoesNotExist:
            return Response(
                {'error': '保護猫が見つかりません'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        is_member = False
        if user.user_type == 'shelter':
            is_member = ShelterUser.objects.filter(
                user=user,
                shelter=cat.shelter,
                is_active=True
            ).exists()
        
        if not is_member:
            raise PermissionDenied('この猫の画像をアップロードする権限がありません')
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(cat=cat)
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class MyCatsView(generics.ListAPIView):
    """自分の所属する保護団体の猫一覧API"""
    
    serializer_class = CatListSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.user_type != 'shelter':
             return Cat.objects.none()
             
        shelter_ids = ShelterUser.objects.filter(
            user=user,
            is_active=True
        ).values_list('shelter_id', flat=True)
        
        return Cat.objects.filter(shelter_id__in=shelter_ids).order_by('-created_at')
