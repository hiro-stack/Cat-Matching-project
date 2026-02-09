"""
Presigned URL upload utilities for Cloudflare R2
"""
import os
import uuid
import boto3
from datetime import timedelta
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings


def generate_presigned_upload_url(file_name, file_type, expires_in=3600):
    """
    Generate a presigned URL for uploading files directly to R2.

    Args:
        file_name: Original file name
        file_type: MIME type of the file
        expires_in: URL expiration time in seconds (default: 1 hour)

    Returns:
        dict: Contains presigned_url, file_key, and public_url
    """
    if not settings.USE_R2_STORAGE:
        raise ValueError("R2 storage is not enabled")

    # Generate unique file key
    file_extension = os.path.splitext(file_name)[1]
    file_key = f"uploads/{uuid.uuid4()}{file_extension}"

    # Create S3 client for R2
    s3_client = boto3.client(
        's3',
        endpoint_url=settings.AWS_S3_ENDPOINT_URL,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        region_name=settings.AWS_S3_REGION_NAME
    )

    # Generate presigned POST URL
    presigned_data = s3_client.generate_presigned_post(
        Bucket=settings.AWS_STORAGE_BUCKET_NAME,
        Key=file_key,
        Fields={"Content-Type": file_type},
        Conditions=[
            {"Content-Type": file_type},
            ["content-length-range", 0, 104857600]  # Max 100MB
        ],
        ExpiresIn=expires_in
    )

    # Construct public URL
    if settings.AWS_S3_CUSTOM_DOMAIN:
        public_url = f"https://{settings.AWS_S3_CUSTOM_DOMAIN}/{file_key}"
    else:
        public_url = f"{settings.AWS_S3_ENDPOINT_URL}/{settings.AWS_STORAGE_BUCKET_NAME}/{file_key}"

    return {
        'presigned_url': presigned_data['url'],
        'fields': presigned_data['fields'],
        'file_key': file_key,
        'public_url': public_url
    }


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def get_upload_url(request):
    """
    API endpoint to get presigned upload URL for R2.

    Request body:
        {
            "file_name": "image.jpg",
            "file_type": "image/jpeg",
            "file_category": "image" or "video"
        }

    Response:
        {
            "presigned_url": "https://...",
            "fields": {...},
            "file_key": "uploads/uuid.jpg",
            "public_url": "https://media.example.com/uploads/uuid.jpg"
        }
    """
    file_name = request.data.get('file_name')
    file_type = request.data.get('file_type')
    file_category = request.data.get('file_category', 'image')

    if not file_name or not file_type:
        return Response(
            {'error': 'file_name and file_type are required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Validate file type
    allowed_image_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    allowed_video_types = ['video/mp4', 'video/quicktime', 'video/x-msvideo']

    if file_category == 'image' and file_type not in allowed_image_types:
        return Response(
            {'error': f'Invalid image type. Allowed: {", ".join(allowed_image_types)}'},
            status=status.HTTP_400_BAD_REQUEST
        )
    elif file_category == 'video' and file_type not in allowed_video_types:
        return Response(
            {'error': f'Invalid video type. Allowed: {", ".join(allowed_video_types)}'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        upload_data = generate_presigned_upload_url(file_name, file_type)
        return Response(upload_data, status=status.HTTP_200_OK)
    except ValueError as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    except Exception as e:
        return Response(
            {'error': f'Failed to generate upload URL: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
