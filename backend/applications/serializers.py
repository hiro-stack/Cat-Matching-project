from rest_framework import serializers
from .models import Application, Message
from cats.serializers import CatListSerializer
from accounts.serializers import UserPublicSerializer, UserPrivateSerializer


class ApplicationSerializer(serializers.ModelSerializer):
    """応募シリアライザー（一覧・公開用）
    
    デフォルトでは個人情報（連絡先、詳細属性）を含まない。
    主にリスト表示や、まだ詳細を見る権限がない状態での表示に使用。
    """
    
    cat_detail = CatListSerializer(source='cat', read_only=True)
    applicant_info = UserPublicSerializer(source='applicant', read_only=True)
    
    class Meta:
        model = Application
        fields = [
            'id', 'cat', 'cat_detail', 'applicant_info',
            'status', 
            # 個人情報フィールドは除外
            'motivation', 'applied_at', 'updated_at'
        ]
        read_only_fields = ['id', 'applied_at', 'updated_at']


class BaseApplicationDetailSerializer(ApplicationSerializer):
    """応募詳細シリアライザーの基底クラス"""
    
    class Meta(ApplicationSerializer.Meta):
        fields = ApplicationSerializer.Meta.fields + [
            'full_name', 'age', 'occupation', 'phone_number',
            'address', 'housing_type', 'has_garden', 'family_members',
            'has_other_pets', 'other_pets_description', 'has_experience',
            'experience_description', 'additional_notes'
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
    重要: applicant_info に UserPrivateSerializer を使用し、詳細な連絡先を開示する。
    """
    applicant_info = UserPrivateSerializer(source='applicant', read_only=True)


class ApplicationCreateSerializer(serializers.ModelSerializer):
    """応募作成用シリアライザー"""
    
    class Meta:
        model = Application
        fields = [
            'id', 'cat', 'full_name', 'age', 'occupation', 'phone_number',
            'address', 'housing_type', 'has_garden', 'family_members',
            'has_other_pets', 'other_pets_description', 'has_experience',
            'experience_description', 'motivation', 'additional_notes'
        ]
        read_only_fields = ['id']


class ApplicationStatusUpdateSerializer(serializers.ModelSerializer):
    """応募ステータス更新用シリアライザー"""
    
    class Meta:
        model = Application
        fields = ['status']
    
    def validate(self, attrs):
        """インスタンスの状態に基づくバリデーション
        
        完了状態（成立・不成立・キャンセル）からのステータス変更を禁止する。
        """
        if not self.instance:
            return attrs

        current_status = self.instance.status
        new_status = attrs.get('status')
        
        if new_status == current_status:
            return attrs

        if current_status in ['accepted', 'rejected', 'cancelled']:
            raise serializers.ValidationError(
                f"現在のステータス（{self.instance.get_status_display()}）からは変更できません。"
            )
            
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
            'id', 'application', 'application_id', 'sender', 'sender_info',
            'content', 'created_at', 'is_read'
        ]
        read_only_fields = ['id', 'application', 'sender', 'created_at']
