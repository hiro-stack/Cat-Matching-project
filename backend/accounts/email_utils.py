"""
追跡可能なメール送信ユーティリティ

全てのメール送信を EmailLog に記録し、送信結果を追跡可能にする。
失敗時はログに記録し、管理コマンドでリトライ可能。
"""

from django.core.mail import send_mail
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)


def send_tracked_email(email_type, to_email, subject, body, related_user=None, from_email=None):
    """追跡可能なメール送信
    
    Args:
        email_type: メールの種類 ('password_reset', 'shelter_registration', etc.)
        to_email: 送信先メールアドレス
        subject: 件名
        body: 本文
        related_user: 関連ユーザー（任意）
        from_email: 送信元メールアドレス（デフォルト: settings.DEFAULT_FROM_EMAIL）
    
    Returns:
        tuple: (success: bool, email_log: EmailLog)
    """
    from .models import EmailLog
    from django.conf import settings
    
    if from_email is None:
        from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@example.com')
    
    # ログレコードを作成（pending状態）
    log = EmailLog.objects.create(
        email_type=email_type,
        to_email=to_email,
        subject=subject,
        body=body,
        from_email=from_email,
        related_user=related_user,
        status='pending',
    )
    
    try:
        send_mail(subject, body, from_email, [to_email])
        log.status = 'sent'
        log.sent_at = timezone.now()
        log.save(update_fields=['status', 'sent_at'])
        logger.info(f"Email sent successfully: type={email_type}, to={to_email}, log_id={log.id}")
        return True, log
    except Exception as e:
        log.status = 'failed'
        log.error_message = str(e)
        log.save(update_fields=['status', 'error_message'])
        logger.error(f"Email send failed: type={email_type}, to={to_email}, error={e}, log_id={log.id}")
        return False, log
