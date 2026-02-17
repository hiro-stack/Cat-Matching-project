from rest_framework import serializers
from .models import Application, Message
from cats.serializers import CatListSerializer, ShelterInfoSerializer
from accounts.serializers import UserPublicSerializer, UserPrivateSerializer


class CatDetailForApplicationSerializer(CatListSerializer):
    """応募詳細に含まれる猫・団体情報用シリアライザー"""
    shelter = ShelterInfoSerializer(read_only=True)
    
    class Meta(CatListSerializer.Meta):
        fields = CatListSerializer.Meta.fields + ['shelter']

class ApplicationSerializer(serializers.ModelSerializer):
    """応募シリアライザー（一覧・公開用）"""
    
    cat_detail = CatDetailForApplicationSerializer(source='cat', read_only=True)
    applicant_info = UserPublicSerializer(source='applicant', read_only=True)
    unread_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Application
        fields = [
            'id', 'cat', 'cat_detail', 'applicant_info',
            'status', 'unread_count',
            'message', 'applied_at', 'updated_at'
        ]
        read_only_fields = ['id', 'applied_at', 'updated_at']

    def get_unread_count(self, obj):
        user = self.context.get('request').user if self.context.get('request') else None
        if not user or not user.is_authenticated:
            return 0
            
        # 自分が応募者の場合：団体または管理者からの未読を出す
        if obj.applicant_id == user.id:
            return obj.messages.filter(read_at__isnull=True).exclude(sender_type='user').count()
            
        # 自分が団体スタッフの場合：ユーザーからの未読を出す
        # 注意: N+1問題の懸念があるため、本番環境では prefetch_related や 
        # queryset.annotate(unread_count=...) の検討が必要。
        # 今回は小規模想定で実装。
        from shelters.models import ShelterUser
        is_shelter_member = ShelterUser.objects.filter(
            user=user,
            shelter_id=obj.shelter_id,
            is_active=True
        ).exists()
        
        if is_shelter_member:
            return obj.messages.filter(read_at__isnull=True).filter(sender_type='user').count()
            
        return 0


class BaseApplicationDetailSerializer(ApplicationSerializer):
    """応募詳細シリアライザーの基底クラス"""
    
    class Meta(ApplicationSerializer.Meta):
        fields = ApplicationSerializer.Meta.fields + [
            'term_agreement', 'lifelong_care_agreement', 'spay_neuter_agreement',
            'medical_cost_understanding', 'income_status',
            'emergency_contact_available', 'family_consent', 'allergy_status',
            'cafe_data_sharing_consent'
        ]


class ApplicationDetailForOwnerSerializer(BaseApplicationDetailSerializer):
    """応募者本人用 応募詳細シリアライザー
    
    応募者本人が自分の応募内容を確認するために使用。
    applicant_info は Public版のままで良い（自分自身なので詳細は知っている前提）。
    """
    pass


class ApplicationDetailForShelterSerializer(BaseApplicationDetailSerializer):
    """保護団体用 応募詳細シリアライザー（連絡先開示版）
    
    保護団体が自団体の猫への応募を確認する際のみ使用する。
    重要: applicant_info に UserPrivateSerializer を使用し、詳細な連絡先とプロフィールを開示する。
    """
    applicant_info = UserPrivateSerializer(source='applicant', read_only=True)


class ApplicationCreateSerializer(serializers.ModelSerializer):
    """応募作成用シリアライザー"""
    
    class Meta:
        model = Application
        fields = [
            'id', 'cat', 'message',
            'term_agreement', 'lifelong_care_agreement', 'spay_neuter_agreement',
            'medical_cost_understanding', 'income_status',
            'emergency_contact_available', 'family_consent', 'allergy_status',
            'cafe_data_sharing_consent'
        ]
        read_only_fields = ['id']
    
    def validate(self, attrs):
        # 必須チェック（念のため）
        if not attrs.get('term_agreement'):
            raise serializers.ValidationError({"term_agreement": "利用規約への同意が必要です。"})
        if not attrs.get('lifelong_care_agreement'):
            raise serializers.ValidationError({"lifelong_care_agreement": "終生飼養への同意が必要です。"})
        if not attrs.get('spay_neuter_agreement'):
            raise serializers.ValidationError({"spay_neuter_agreement": "不妊去勢への同意が必要です。"})

        # 応募制限チェック：一度に応募できる猫は3匹まで
        user = self.context['request'].user
        active_statuses = ['pending', 'reviewing', 'accepted']
        active_applications_count = Application.objects.filter(
            applicant=user,
            status__in=active_statuses
        ).count()

        if active_applications_count >= 3:
            raise serializers.ValidationError({
                "cat": f"現在進行中の応募が{active_applications_count}件あります。一度に応募できる猫は3匹までです。"
                       "既存の応募が完了（譲渡済み・不成立・キャンセル）してから新しい応募をしてください。"
            })

        return attrs


class ApplicationStatusUpdateSerializer(serializers.ModelSerializer):
    """応募ステータス更新用シリアライザー（状態マシン付き）"""
    
    # 許可される状態遷移マップ
    ALLOWED_TRANSITIONS = {
        'pending':   ['reviewing', 'cancelled'],
        'reviewing': ['trial', 'rejected', 'cancelled'],
        'trial':     ['accepted', 'rejected', 'cancelled'],
        'accepted':  [],  # 完了 → 変更不可
        'rejected':  [],  # 完了 → 変更不可
        'cancelled': [],  # 完了 → 変更不可
    }
    
    class Meta:
        model = Application
        fields = ['status']
    
    def validate(self, attrs):
        """状態マシンに基づくバリデーション
        
        ALLOWED_TRANSITIONS に定義されていない遷移は拒否する。
        同一ステータスの再送信は冪等的に成功を返す。
        """
        if not self.instance:
            return attrs

        current_status = self.instance.status
        new_status = attrs.get('status')
        
        # 同一ステータスなら冪等的に成功
        if new_status == current_status:
            return attrs

        allowed = self.ALLOWED_TRANSITIONS.get(current_status, [])
        if new_status not in allowed:
            status_display = dict(Application.STATUS_CHOICES)
            raise serializers.ValidationError({
                'status': f'「{status_display.get(current_status, current_status)}」から'
                          f'「{status_display.get(new_status, new_status)}」への変更はできません。',
                'current_status': current_status,
                'allowed_transitions': allowed,
            })
            
        return attrs


class MessageSerializer(serializers.ModelSerializer):
    """メッセージシリアライザー
    
    【実装時の注意】
    View層（ModelViewSet等）で以下の制御を必ず行うこと：
    1. application: URLパラメータ等から特定し、perform_create で固定する
    2. sender: request.user で固定する
    
    クライアントからの入力による改ざんを防ぐため、上記フィールドは read_only となっている。
    """
    
    sender_info = UserPublicSerializer(source='sender', read_only=True)
    # クライアントからはIDで指定を受け、内部で検証して application オブジェクトに変換・設定する
    application_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = Message
        fields = [
            'id', 'application', 'application_id', 'sender', 'sender_type', 'sender_info',
            'content', 'created_at', 'is_read'
        ]
        read_only_fields = ['id', 'application', 'sender', 'sender_type', 'created_at']
