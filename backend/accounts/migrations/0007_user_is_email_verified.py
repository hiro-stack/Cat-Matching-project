from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0006_user_is_2fa_enabled_alter_emaillog_email_type_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='is_email_verified',
            field=models.BooleanField(default=False, verbose_name='メール認証済み'),
        ),
        migrations.AlterField(
            model_name='emaillog',
            name='email_type',
            field=models.CharField(
                choices=[
                    ('password_reset', 'パスワードリセット'),
                    ('shelter_registration', '団体登録通知'),
                    ('shelter_approval', '団体承認通知'),
                    ('shelter_rejection', '団体否認通知'),
                    ('application_status', '応募ステータス変更'),
                    ('two_factor', '二段階認証コード'),
                    ('email_verification', 'メール認証'),
                    ('other', 'その他'),
                ],
                max_length=50,
                verbose_name='メール種別',
            ),
        ),
    ]
