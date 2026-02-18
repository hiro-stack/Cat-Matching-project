from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError, PermissionDenied
from rest_framework.parsers import MultiPartParser, FormParser
from django.db.models import Q
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
    
    # create(POST) は IsAuthenticated が必要だが、List(GET) は AllowAny でも良い場合がある
    # ここでは厳密に制御せず、セッション認証前提なら IsAuthenticatedOrReadOnly 的な動きになるよう調整
    # ただし今回は IsShelterMemberOrReadOnly を使っているので、GETは誰でもOK、POSTはShelterのみとなる
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CatCreateUpdateSerializer
        return CatListSerializer
    
    def get_queryset(self):
        # select_related を使用してN+1問題を回避し、フィルター精度を向上
        queryset = Cat.objects.select_related('shelter').all()

        # 一般公開用一覧は、"常に" 公開設定がONのもののみ表示する
        # かつ、所属する団体が公開プロフィールを有効にしており、審査が承認済みであること
        queryset = queryset.filter(
            is_public=True,
            shelter__public_profile_enabled=True,
            shelter__verification_status='approved'
        )
        
        # 検索フィルター (キーワード検索)
        # 性格詳細、団体名、都道府県、市区町村も検索対象に含める
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(breed__icontains=search) |
                Q(color__icontains=search) |
                Q(personality__icontains=search) |
                Q(description__icontains=search) |
                Q(other_terms__icontains=search) |
                Q(shelter__name__icontains=search) |
                Q(shelter__prefecture__icontains=search) |
                Q(shelter__city__icontains=search)
            )

        # フィルター: 性別
        gender = self.request.query_params.get('gender', None)
        if gender:
             queryset = queryset.filter(gender=gender)

        # フィルター: 年齢区分 (age_category)
        age_category = self.request.query_params.get('age_category', None)
        if age_category:
            queryset = queryset.filter(age_category=age_category)

        # フィルター: 都道府県 (shelter__prefecture) - 複数選択対応
        prefectures = self.request.query_params.getlist('prefecture')
        if prefectures:
            # カンマ区切り（frontendから single string で送られた場合）も考慮
            actual_prefectures = []
            for p in prefectures:
                if p:
                    actual_prefectures.extend(p.split(','))
            
            # 重複除去と空文字除去
            actual_prefectures = list(set([p for p in actual_prefectures if p]))
            
            if actual_prefectures:
                queryset = queryset.filter(shelter__prefecture__in=actual_prefectures)

        # フィルター: 性格区分 (activity_level)
        activity_level = self.request.query_params.get('activity_level', None)
        if activity_level:
            queryset = queryset.filter(activity_level=activity_level)

        # フィルター: 甘えん坊度 (affection_level)
        affection_level = self.request.query_params.get('affection_level', None)
        if affection_level:
            queryset = queryset.filter(affection_level=affection_level)

        # フィルター: お手入れ (maintenance_level)
        maintenance_level = self.request.query_params.get('maintenance_level', None)
        if maintenance_level:
            queryset = queryset.filter(maintenance_level=maintenance_level)

        # フィルター: 団体ID
        shelter_id = self.request.query_params.get('shelter_id', None)
        if shelter_id:
            queryset = queryset.filter(shelter_id=shelter_id)

        # ステータスフィルター
        cat_status = self.request.query_params.get('status', None)
        
        if cat_status:
            queryset = queryset.filter(status=cat_status)
        
        return queryset.order_by('-created_at')
    
    def perform_create(self, serializer):
        user = self.request.user
        
        if not user.is_authenticated or user.user_type != 'shelter':
            raise PermissionDenied("保護団体アカウントでログインしてください。")
        
        # 所属する有効な保護団体を取得
        shelter_user = ShelterUser.objects.filter(
            user=user, 
            is_active=True
        ).first()

        if not shelter_user:
            raise ValidationError("有効な保護団体に所属していないため、猫を登録できません。")
            
        serializer.save(shelter=shelter_user.shelter)


class CatDetailView(generics.RetrieveUpdateDestroyAPIView):
    """保護猫詳細・更新・削除API"""
    
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_queryset(self):
        queryset = Cat.objects.select_related('shelter').all()
        
        # PUT/PATCH/DELETE の場合は全猫を対象（権限チェックは perform_update/destroy で行う）
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return queryset
        
        # GETの場合: 公開猫は誰でも閲覧可能
        # 非公開猫は、その団体のメンバーまたは管理者のみ閲覧可能
        user = self.request.user
        if user.is_authenticated and (user.is_superuser or user.user_type in ['shelter', 'admin']):
            # シェルターユーザー/管理者: 公開猫 + 自分の団体の非公開猫
            from django.db.models import Q
            shelter_ids = ShelterUser.objects.filter(
                user=user, is_active=True
            ).values_list('shelter_id', flat=True)
            queryset = queryset.filter(
                Q(is_public=True) | Q(shelter_id__in=shelter_ids)
            )
        else:
            # 一般ユーザー/未ログイン: 公開猫のみ
            # かつ、所属団体も公開・承認済みであること
            queryset = queryset.filter(
                is_public=True,
                shelter__public_profile_enabled=True,
                shelter__verification_status='approved'
            )
        
        return queryset
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return CatCreateUpdateSerializer
        return CatDetailSerializer

    def perform_update(self, serializer):
        # 更新権限チェック
        cat = self.get_object()
        user = self.request.user
        
        if not user.is_authenticated or user.user_type != 'shelter':
             raise PermissionDenied("編集権限がありません。")

        is_member = ShelterUser.objects.filter(
            user=user,
            shelter=cat.shelter,
            is_active=True
        ).exists()
        
        if not is_member:
            raise PermissionDenied("この猫を編集する権限がありません（所属団体が異なります）。")
            
        serializer.save()

    def perform_destroy(self, instance):
        # 削除権限チェック
        user = self.request.user
        if not user.is_authenticated or user.user_type != 'shelter':
             raise PermissionDenied("削除権限がありません。")

        is_member = ShelterUser.objects.filter(
            user=user,
            shelter=instance.shelter,
            is_active=True
        ).exists()
        
        if not is_member:
            raise PermissionDenied("この猫を削除する権限がありません。")
            
        # スタッフ権限の制限
        if not user.is_superuser:
            shelter_user = ShelterUser.objects.filter(user=user, shelter=instance.shelter, is_active=True).first()
            if shelter_user and shelter_user.role == 'staff':
                raise PermissionDenied("スタッフ権限では猫のデータを削除できません。管理者に依頼してください。")
            
        instance.delete()


class CatImageUploadView(generics.CreateAPIView):
    """保護猫画像アップロードAPI"""
    
    queryset = CatImage.objects.all()
    serializer_class = CatImageSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    def create(self, request, *args, **kwargs):
        cat_id = self.kwargs.get('cat_id')  # kwargsから取得するように修正
        user = request.user
        
        try:
            cat = Cat.objects.get(id=cat_id)
        except Cat.DoesNotExist:
            return Response(
                {'error': '保護猫が見つかりません'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # 権限チェック
        is_member = False
        if user.user_type == 'shelter':
            is_member = ShelterUser.objects.filter(
                user=user,
                shelter=cat.shelter,
                is_active=True
            ).exists()
        
        if not is_member:
            raise PermissionDenied('この猫の画像をアップロードする権限がありません')
        
        # serializerにデータを渡す際、catはsave時に渡すのでここではrequest.dataのみ
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            serializer.save(cat=cat)
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response(
                {'error': f'画像の保存に失敗しました: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class CatVideoUploadView(generics.CreateAPIView):
    """保護猫動画アップロードAPI"""
    
    queryset = CatVideo.objects.all()
    serializer_class = CatVideoSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    def create(self, request, *args, **kwargs):
        cat_id = self.kwargs.get('cat_id')
        user = request.user
        
        try:
            cat = Cat.objects.get(id=cat_id)
        except Cat.DoesNotExist:
            return Response(
                {'error': '保護猫が見つかりません'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # 権限チェック
        is_member = False
        if user.user_type == 'shelter':
            is_member = ShelterUser.objects.filter(
                user=user,
                shelter=cat.shelter,
                is_active=True
            ).exists()
        
        if not is_member:
            raise PermissionDenied('この猫の動画をアップロードする権限がありません')
        
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
        
        # スーパーユーザーは全件表示（デバッグ・管理者用）
        if user.is_superuser:
            return Cat.objects.all().order_by('-created_at')

        if user.user_type != 'shelter':
             return Cat.objects.none()
             
        # ユーザーが所属する有効な団体IDリスト
        shelter_ids = ShelterUser.objects.filter(
            user=user,
            is_active=True
        ).values_list('shelter', flat=True)
        
        return Cat.objects.filter(shelter__in=shelter_ids).order_by('-created_at')
