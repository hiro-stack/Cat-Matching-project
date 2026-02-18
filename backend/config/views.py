from django.http import JsonResponse
from django.core.mail import send_mail
from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
import logging

logger = logging.getLogger(__name__)

def health_check(request):
    """Health check endpoint for monitoring and load balancers."""
    return JsonResponse({"status": "ok", "service": "cat-matching-api"})

@api_view(['POST'])
@permission_classes([AllowAny])
def contact_view(request):
    name = request.data.get('name')
    email = request.data.get('email')
    subject_code = request.data.get('subject')
    message = request.data.get('message')
    
    subject_map = {
        'bug': '不具合の報告',
        'request': '機能の要望',
        'account': 'アカウントについて',
        'privacy': '規約・プライバシーについて',
        'other': 'その他'
    }
    subject_label = subject_map.get(subject_code, 'その他')
    
    email_body = (
        f"【お迎えマッチ お問い合わせ】\n\n"
        f"お名前: {name}\n"
        f"メールアドレス: {email}\n"
        f"お問い合わせ種別: {subject_label}\n\n"
        f"--- お問い合わせ内容 ---\n"
        f"{message}\n"
    )
    
    try:
        # 管理者への通知
        send_mail(
            subject=f"【お問い合わせ】{subject_label} - {name}様",
            message=email_body,
            from_email=settings.EMAIL_HOST_USER or 'noreply@example.com',
            recipient_list=['zhanghiromo@gmail.com'],
            fail_silently=False,
        )
        return Response({"message": "Success"}, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Contact form email failed: {str(e)}")
        # メール送信に失敗しても、ログには残し、一旦エラーを返す
        return Response(
            {"error": "Failed to send email. Please try again later.", "details": str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
