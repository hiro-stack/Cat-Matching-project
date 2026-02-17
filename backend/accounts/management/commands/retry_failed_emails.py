"""
失敗したメールを再送信する管理コマンド

Usage:
    python manage.py retry_failed_emails
    python manage.py retry_failed_emails --max-retries 5
"""

from django.core.management.base import BaseCommand
from django.core.mail import send_mail
from django.utils import timezone
from django.db import models
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = '失敗したメールを再送信する'

    def add_arguments(self, parser):
        parser.add_argument(
            '--max-retries',
            type=int,
            default=3,
            help='最大リトライ回数 (デフォルト: 3)',
        )

    def handle(self, *args, **options):
        from accounts.models import EmailLog
        
        max_retries = options['max_retries']
        
        failed_emails = EmailLog.objects.filter(
            status='failed',
            retry_count__lt=max_retries,
        ).order_by('created_at')
        
        total = failed_emails.count()
        if total == 0:
            self.stdout.write(self.style.SUCCESS('再送信が必要なメールはありません。'))
            return
        
        self.stdout.write(f'{total} 件の失敗メールを再送信します...')
        
        success_count = 0
        fail_count = 0
        
        for log in failed_emails:
            try:
                send_mail(
                    log.subject,
                    log.body,
                    log.from_email,
                    [log.to_email],
                )
                log.status = 'sent'
                log.sent_at = timezone.now()
                log.retry_count = models.F('retry_count') + 1
                log.save(update_fields=['status', 'sent_at', 'retry_count'])
                success_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'  ✓ {log.to_email} ({log.email_type})')
                )
            except Exception as e:
                log.retry_count = models.F('retry_count') + 1
                log.error_message = str(e)
                log.save(update_fields=['retry_count', 'error_message'])
                fail_count += 1
                self.stdout.write(
                    self.style.ERROR(f'  ✗ {log.to_email} ({log.email_type}): {e}')
                )
        
        self.stdout.write(
            self.style.SUCCESS(
                f'\n完了: 成功 {success_count} 件, 失敗 {fail_count} 件'
            )
        )
