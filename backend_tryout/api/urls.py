from django.urls import path, include
from .views import *
from rest_framework_simplejwt.views import TokenRefreshView



urlpatterns = [
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    path('register/', RegisterView.as_view(), name='register'),
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path("verify-otp/", VerifyOTPView.as_view(), name="verify-otp"),
    path("resend-otp/", resend_otp, name="resend-otp"),  # <- ini

    path('user/detail/', UserDetailUpdateView.as_view(), name='user-detail-update'),

    path('me/', MeView.as_view(), name='me'),



    path('tryouts/', TryoutListView.as_view(), name='tryout_list'), 
    # path("tryout/<int:pk>/", TryoutListView.as_view(), name="tryout-detail"),
    path('tryouts/<int:tryout_id>/start/', start_tryout_session, name='tryout-start'),
    path('tryout-session/<int:tryout_id>/', TryoutSessionDetailView.as_view(), name='tryout-session-detail'),

    path('questions/', QuestionListView.as_view(), name='questions-list'),
    path('answer/draft/', DraftAnswerView.as_view(), name='answer-draft'),
    path("tryouts/<int:tryout_id>/submit/", SubmitTryoutView.as_view(), name="tryout-submit"),
    path("tryouts/<int:tryout_id>/result/", TryoutResultView.as_view(), name="tryout-result"),

    path('latihan-soal/bulk-upload/', LatihanSoalBulkUploadView.as_view(), name='latihan-soal-bulk-upload'),
    path('tryout/bulk-upload/', TryoutQuestionBulkUploadView.as_view(), name='tryout-bulk-upload'),





    #admin
    path('question/upload/', QuestionUploadView.as_view(), name='tryout-upload'),
    path('tryout/upload/', TryoutUploadView.as_view(), name='question-upload'),

    # Public Endpoints
    path('practice-tests/', PracticeTestViewSet.as_view(), name='practice-test-list'),
    path('materi/', MateriListView.as_view(), name='materi-list'),
    path('detail-materi/<int:materi_id>/', MateriDetailView.as_view(), name='materi-detail'),

    path('latihan/', LatihanViewSet.as_view(), name='latihan-list'),
    path('latihan-soal/', LatihanSoalListView.as_view(), name='latihan-soal-list'),

    # Latihan Results and Submissions
    path('latihan-soal/<int:latihan_id>/result/', LatihanResultView.as_view(), name='latihan-result'),
    path('latihan-soal/<int:latihan_id>/submit/', SubmitLatihanView.as_view(), name='latihan-submit'),

    # Admin Endpoints (Upload)
    path('practice-test/upload/', PracticeTestUploadView.as_view(), name='practice-test-upload'),
    path('materi/upload/', MateriUploadView.as_view(), name='materi-upload'),
    path('latihan/upload/', LatihanUploadView.as_view(), name='latihan-upload'),
    path('latihan-soal/upload/', LatihanSoalUploadView.as_view(), name='latihan-soal-upload'),



    path("ckeditor/upload/", upload_image, name="ckeditor-upload"),
    # path('ckeditor/upload', include('ckeditor_uploader.urls')),


    path("create_transaction/", create_transaction, name="create_payment"),
    path("payment-notification/", payment_notification, name="payment_notification"),

    path("subscription/", SubscriptionViewSet.as_view({'get': 'list'}), name="subs"),

    path("quote/", QuoteViewSet.as_view(), name="quote"),
    path("countdown/", CountDownViewSet.as_view(), name="countdown"),
    path("event/", EventViewSet.as_view(), name="event"),


    path("forgot-password/", request_password_reset, name="forgot-password"),
    path("reset-password/<uid>/<token>/", reset_password, name="reset-password-confirm"),
    
    path("rank/tryout/<int:tryout_id>/", TryoutRankListView.as_view(), name="tryout-rank"),
    path("rank/total/", TotalRankListView.as_view(), name="total-rank"),

    path("stats/", user_stats, name="user-stats"),



]
