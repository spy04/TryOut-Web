from django.shortcuts import render

# Create your views here.
from .models import CustomUser
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import *
from rest_framework.response import Response
from rest_framework import generics, permissions, status, viewsets
from django.core.cache import cache
from rest_framework.views import APIView 
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import AllowAny
from datetime import datetime, timedelta
import pytz
from django.core.cache import cache


from django.shortcuts import get_object_or_404

from django.core.files.storage import default_storage

from rest_framework.decorators import api_view, permission_classes
from django.core.files.base import ContentFile

from django.utils import timezone
from datetime import timedelta
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.tokens import default_token_generator

User = get_user_model()



@api_view(["POST"])
@permission_classes([AllowAny])
def request_password_reset(request):
    serializer = PasswordResetRequestSerializer(data=request.data, context={'request': request})
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response({"message": "Link reset password terkirim ke email"})


@permission_classes([AllowAny])
@api_view(["POST"])
def reset_password(request, uid, token):   # <- harus ada uid & token
    try:
        uid = urlsafe_base64_decode(uid).decode()
        user = User.objects.get(pk=uid)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        return Response({"error": "Invalid link"}, status=400)

    if not default_token_generator.check_token(user, token):
        return Response({"error": "Invalid or expired token"}, status=400)

    new_password = request.data.get("password")
    if not new_password:
        return Response({"error": "Password required"}, status=400)

    user.set_password(new_password)
    user.save()
    return Response({"message": "Password reset successful"})

def delete_inactive_users():
    cutoff = timezone.now() - timedelta(hours=24)
    User.objects.filter(is_active=False, date_joined__lte=cutoff).delete()

class UserDetailUpdateView(generics.RetrieveUpdateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = UserDetailSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        """
        Mengambil user berdasarkan token (request.user) yang sedang aktif.
        """
        return self.request.user  # Menggunakan request.user untuk mengambil user yang sedang login




class RegisterView(APIView):
    def post(self, request):
        email = request.data.get("email")
        user = CustomUser.objects.filter(email=email).first()

        if user:
            if not user.is_active:
                # user ada tapi belum aktif → kirim ulang OTP
                otp = send_otp_email(user.email)
                user.otp_code = otp
                user.save()
                return Response({"message": "OTP baru dikirim ke email."}, status=status.HTTP_200_OK)
            else:
                return Response({"error": "Email sudah aktif, silakan login."}, status=status.HTTP_400_BAD_REQUEST)

        # kalau email baru → buat user
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save(is_active=False)  # tetap inactive dulu
            otp = send_otp_email(user.email)
            user.otp_code = otp
            user.save()

            return Response({"message": "Registrasi berhasil, OTP dikirim."}, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class VerifyOTPView(generics.GenericAPIView):
    serializer_class = VerifyOTPSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]

        # generate token
        refresh = RefreshToken.for_user(user)

        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": {
                "id": user.id,
                "email": user.email,
            }
        })



@api_view(['POST'])
def resend_otp(request):
    serializer = ResendOTPSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    email = serializer.validated_data['email']

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({"error": "Email tidak terdaftar"}, status=400)

    # hapus OTP lama kalau ada
    EmailOTP.objects.filter(user=user).delete()

    # kirim OTP baru
    otp = send_otp_email(user.email)
    EmailOTP.objects.create(user=user, otp=otp)

    return Response({"message": "OTP baru telah dikirim"})

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            return Response(serializer.validated_data)
        return Response(serializer.errors, status=400)

class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            "id": user.id,
            "email": user.email,
            "is_staff": user.is_staff,
        })

class TryoutListView(generics.ListAPIView):
    queryset = Tryout.objects.all()
    serializer_class = TryoutSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["request"] = self.request
        return context
    

from rest_framework.generics import RetrieveAPIView

class TryoutSessionDetailView(RetrieveAPIView):
    queryset = TryoutSession.objects.all()
    serializer_class = TryoutSessionSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        user = self.request.user
        tryout_id = self.kwargs['tryout_id']
        return TryoutSession.objects.get(user=user, tryout_id=tryout_id)
    

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def start_tryout_session(request, tryout_id):
    user = request.user
    tryout = get_object_or_404(Tryout, id=tryout_id)
    session, created = TryoutSession.objects.get_or_create(user=user, tryout=tryout)
    if created:
        session.start_date = timezone.now()
        session.finished = False
        session.save()

    serializer = TryoutSessionSerializer(session)
    return Response(serializer.data)

# @api_view(["GET"])
# @permission_classes([IsAuthenticated])
# def tryout_result(request, tryout_id):
#     answers = UserAnswer.objects.filter(
#         user=request.user, question__tryout_id=tryout_id
#     )
#     serializer = UserAnswerReviewSerializer(answers, many=True)

#     summary = {
#         "total": answers.count(),
#         "correct": answers.filter(is_correct=True).count(),
#         "wrong": answers.filter(is_correct=False).count(),
#     }

#     return Response({
#         "summary": summary,
#         "answers": serializer.data   # <- disini harus serializer.data
#     })


class QuestionListView(generics.ListAPIView):
    serializer_class = QuestionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        tryout_id = self.request.query_params.get('tryout_id')
        cache_key = f"tryout_{tryout_id}_questions"
        cached = cache.get(cache_key)
        if cached:
            return cached
        qs = Question.objects.filter(tryout_id=tryout_id)
        cache.set(cache_key, qs, timeout=3600)
        return qs

class DraftAnswerView(generics.GenericAPIView):
    serializer_class = DraftAnswerSerializer
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        data = request.data  # misal: { "1": "A", "2": "B" }
        objs = []

        for question_id, selected_option in data.items():
            objs.append(UserAnswer(
                user=request.user,
                question_id=question_id,
                selected_option=selected_option,
                submitted=False
            ))

        UserAnswer.objects.bulk_create(objs, ignore_conflicts=True)
        return Response({"message": "Draft saved"}, status=200)
    
class TryoutResultView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, tryout_id):
        # filter jawaban user yg udah submit
        answers = UserAnswer.objects.filter(
            user=request.user,
            question__tryout_id=tryout_id,
            submitted=True
        )

        serializer = UserAnswerReviewSerializer(answers, many=True)

        total = answers.count()
        correct = answers.filter(is_correct=True).count()
        wrong = total - correct

        return Response({
            "tryout_id": tryout_id,
            "summary": {
                "total": total,
                "correct": correct,
                "wrong": wrong,
            },
            "answers": serializer.data  # kasih detail tiap jawaban
        })


class SubmitTryoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, tryout_id):
        user = request.user
        tryout = get_object_or_404(Tryout, id=tryout_id)

        # ambil atau buat session
        session, _ = TryoutSession.objects.get_or_create(user=user, tryout=tryout)

        if session.finished:
            return Response({"detail": "Tryout sudah disubmit, tidak bisa diulang."}, status=400)

        answers = request.data  # format: {question_id: "A", ...}
        results = []
        correct_count = 0

        for q_id, selected in answers.items():
            try:
                ua = UserAnswer.objects.get(user=user, question_id=q_id)
            except UserAnswer.DoesNotExist:
                ua = UserAnswer(user=user, question_id=q_id)

            ua.selected_option = selected
            ua.submitted = True
            ua.is_correct = (ua.question.answer == selected)
            ua.save()

            if ua.is_correct:
                correct_count += 1

            results.append({
                "question_id": q_id,
                "selected": selected,
                "correct": ua.question.answer,
                "is_correct": ua.is_correct,
                "answered_at": ua.answered_at
            })

        # selesaiin session
        session.finished = True
        session.end_date = timezone.now()
        session.save()

        # update TryoutRank dengan jumlah jawaban benar
        TryoutRank.objects.update_or_create(
            user=user,
            tryout=tryout,
            defaults={"score": correct_count}
        )

        # total score semua tryout user
        total_score_tryouts = TryoutRank.objects.filter(user=user).aggregate(
            total=models.Sum("score")
        )["total"] or 0

        # total score latihan user
        total_score_latihan = LatihanUserAnswer.objects.filter(
            user=user,
            submitted_latihan_soal=True,
            is_correct_latihan_soal=True
        ).count()

        # gabungkan total score
        total_score = total_score_tryouts + total_score_latihan

        # simpan total score ke TotalRank
        TotalRank.objects.update_or_create(
            user=user,
            defaults={"total_score": total_score}
        )

        return Response({
            "tryout_id": tryout_id,
            "results": results,
            "score": correct_count,
            "total_score": total_score
        })


class PracticeTestViewSet(generics.ListAPIView):
    queryset = PracticeTest.objects.all()
    serializer_class = PracticeTestSerializer
    permission_classes = [permissions.IsAuthenticated]

class MateriListView(generics.ListAPIView):
    serializer_class = MateriSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        practice_id = self.request.query_params.get('practice_id')
        if practice_id:
            return Materi.objects.filter(practicetest_id=practice_id)
        return Materi.objects.all()
    
from django.http import Http404

class MateriDetailView(generics.RetrieveAPIView):
    serializer_class = MateriSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Materi.objects.all()

    def get_object(self):
        materi_id = self.kwargs.get('materi_id')
        try:
            return Materi.objects.get(id=materi_id)
        except Materi.DoesNotExist:
            raise Http404("Materi not found")  # Return 404 when Materi doesn't exist
        
class LatihanViewSet(generics.ListAPIView):
    serializer_class = LatihanSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        latihan_id = self.request.query_params.get('latihan_id')
        if latihan_id:
            # Filter berdasarkan id materi, karena latihan adalah ForeignKey
            return Latihan.objects.filter(latihan_id=latihan_id)
        return Latihan.objects.all()


class LatihanSoalListView(generics.ListAPIView):
    serializer_class = LatihanSoalSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        latsol_id = self.request.query_params.get('latihan_id')  # Get query parameter
        if latsol_id:  # Use latsol_id to filter LatihanSoal
            return LatihanSoal.objects.filter(latsol_id=latsol_id)
        return LatihanSoal.objects.all()


class LatihanResultView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, latihan_id):
        # Filter UserAnswer berdasarkan latihan_id dari LatihanSoal yang terhubung dengan latihan
        answers = LatihanUserAnswer.objects.filter(
            user=request.user,
            question_latihan_soal__latsol__latihan_id=latihan_id,
            submitted_latihan_soal=True
        )

        total = answers.count()
        correct = answers.filter(is_correct_latihan_soal=True).count()
        wrong = total - correct

        return Response({
            "latihan_id": latihan_id,
            "total": total,
            "correct": correct,
            "wrong": wrong
        })
class SubmitLatihanView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, latihan_id):
        answers = request.data  # {question_id: "A", ...}
        results = []

        for question_id, selected in answers.items():
            ua, created = LatihanUserAnswer.objects.get_or_create(
                user=request.user,
                question_latihan_soal_id=question_id
            )
            ua.selected_option_latihan_soal = selected
            ua.submitted_latihan_soal = True
            ua.is_correct_latihan_soal = (ua.question_latihan_soal.answer_latihan == selected)
            ua.save()

            results.append({
                "question_id": question_id,
                "selected": selected,
                "correct": ua.question_latihan_soal.answer_latihan,
                "is_correct": ua.is_correct_latihan_soal,
                "answered_at": ua.answered_at_latihan_soal
            })

        # ✅ Update total score user
        total_score_tryouts = TryoutRank.objects.filter(user=request.user).aggregate(
            total=models.Sum("score")
        )["total"] or 0

        total_score_latihan = LatihanUserAnswer.objects.filter(
            user=request.user,
            submitted_latihan_soal=True
        ).aggregate(
            total=models.Sum(
                models.Case(
                    models.When(is_correct_latihan_soal=True, then=1),
                    default=0,
                    output_field=models.IntegerField()
                )
            )
        )["total"] or 0

        total_score = total_score_tryouts + total_score_latihan

        TotalRank.objects.update_or_create(
            user=request.user,
            defaults={"total_score": total_score}
        )

        return Response({
            "latihan_id": latihan_id,
            "results": results,
            "total_score": total_score
        })

#admin
class TryoutUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, format=None):
        serializer = TryoutSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class QuestionUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, format=None):
        serializer = QuestionUploadSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

class PracticeTestUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, format=None):
        serializer = PracticeTestSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class MateriUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, format=None):
        # Tambahkan logging untuk melihat data yang masuk
        print("Received request data:", request.data)
        
        serializer = MateriUploadSerializer(data=request.data)
        
        if serializer.is_valid():
            # Menyimpan data jika valid
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        # Return error jika data tidak valid
        print("Validation errors:", serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    
    
class LatihanUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, format=None):
        serializer = LatihanUploadSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    



class LatihanSoalUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, format=None):
        serializer = LatihanSoalUploadSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
# @permission_classes([IsAuthenticated])  # atau kosongin kalau bebas
def upload_image(request):
    file = request.FILES.get("upload")  # CKEditor kirim field name = "upload"
    if not file:
        return Response({"uploaded": False, "error": {"message": "No file uploaded"}})

    path = default_storage.save(f"uploads/{file.name}", ContentFile(file.read()))
    file_url = default_storage.url(path)

    return Response({
        "uploaded": True,
        "url": request.build_absolute_uri(file_url)
    })



import uuid
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from .models import Transaction, Profile
from django.contrib.auth import get_user_model
import midtransclient

User = get_user_model()


def get_price_after_discount(subscription):
    now = timezone.now()
    # cek diskon aktif
    active_discount = subscription.discounts.filter(
        start_date__lte=now,
        end_date__gte=now
    ).first()
    
    if active_discount and active_discount.percentage:
        harga_final = subscription.harga * (100 - active_discount.percentage) / 100
        return subscription.harga, active_discount.percentage, int(harga_final)
    return subscription.harga, None, subscription.harga



@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_transaction(request):
    user = request.user
    sub_id = request.data.get("subscription_id")
    sub = Subscription.objects.get(id=sub_id)

    harga_normal, diskon, harga_final = get_price_after_discount(sub)

    order_id = f"order-{user.id}-{uuid.uuid4().hex[:8]}"

    # simpan transaction di DB
    trx = Transaction.objects.create(
        user=user,
        subscription=sub, 
        order_id=order_id,
        amount=harga_final,
        status="pending"
    )

    # setup Midtrans Snap
    snap = midtransclient.Snap(
        is_production=settings.MIDTRANS_IS_PRODUCTION,  
        server_key=settings.MIDTRANS_SERVER_KEY,
        client_key=settings.MIDTRANS_CLIENT_KEY
    )

    param = {
        "transaction_details": {
            "order_id": order_id,
            "gross_amount": harga_final,
        },
        "customer_details": {
            "first_name": user.first_name or "Guest",
            "email": user.email,
        }
    }

    transaction = snap.create_transaction(param)

    return Response({
        "order_id": trx.order_id,
        "subscription": {
            "id": sub.id,
            "title": sub.title,
            "harga_normal": harga_normal,
            "diskon": diskon,
            "harga_final": harga_final
        },
        "token": transaction["token"],
        "redirect_url": transaction["redirect_url"]
    })


@api_view(["POST"])
@permission_classes([AllowAny])
def payment_notification(request):
    notif = request.data
    print("Notif received:", notif)

    order_id = notif.get("order_id")
    transaction_status = notif.get("transaction_status")
    settlement_time_str = notif.get("settlement_time")  # dari Midtrans

    if not order_id or not transaction_status:
        return Response({"status": "error", "message": "Missing order_id or transaction_status"}, status=400)

    try:
        trx = Transaction.objects.get(order_id=order_id)
        trx.status = transaction_status.lower()

        # tentukan waktu mulai
        if settlement_time_str:
            settlement_time = datetime.strptime(settlement_time_str, "%Y-%m-%d %H:%M:%S")
            settlement_time = pytz.timezone("Asia/Jakarta").localize(settlement_time)
        else:
            settlement_time = timezone.now()

        # update transaction jika settlement
        if transaction_status.lower() == "settlement":
            trx.start_date = settlement_time
            if trx.subscription:
                trx.end_date = settlement_time + timedelta(days=trx.subscription.duration_days)
            else:
                trx.end_date = settlement_time + timedelta(days=30)  # default
            trx.save()

            # update profile
            profile, _ = Profile.objects.get_or_create(user=trx.user)
            profile.is_pro = True
            profile.start_date = trx.start_date
            profile.end_date = trx.end_date
            profile.save()

            return Response({"status": "success", "message": "User upgraded to PRO"})

        elif transaction_status.lower() in ["cancel", "deny", "expire"]:
            trx.save()  # update status di transaction
            profile, _ = Profile.objects.get_or_create(user=trx.user)
            profile.is_pro = False
            profile.save()
            return Response({"status": "failed", "message": "Payment failed"})

        else:
            trx.save()
            return Response({"status": "pending", "message": "Payment pending"})

    except Transaction.DoesNotExist:
        return Response({"status": "error", "message": "Invalid order_id"}, status=400)
    
class TryoutRankListView(generics.ListAPIView):
    serializer_class = TryoutRankSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        tryout_id = self.kwargs["tryout_id"]
        return TryoutRank.objects.filter(tryout_id=tryout_id).order_by("-score")


# ✅ Ranking total semua soal
class TotalRankListView(generics.ListAPIView):
    serializer_class = TotalRankSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return TotalRank.objects.all().order_by("-total_score")

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        rank_labels = {
            1: "GOD",
            2: "LEGEND",
            3: "MASTER",
            4: "ELITE",
            5: "PRO",
        }
        data = []
        for i, rank in enumerate(queryset, start=1):
            user = rank.user
            profile = getattr(user, "profile", None)

            # Hitung total benar & total soal
            total_benar_tryout = UserAnswer.objects.filter(user=user, submitted=True, is_correct=True).count()
            total_soal_tryout = UserAnswer.objects.filter(user=user, submitted=True).count()
            total_benar_latihan = LatihanUserAnswer.objects.filter(user=user, submitted_latihan_soal=True, is_correct_latihan_soal=True).count()
            total_soal_latihan = LatihanUserAnswer.objects.filter(user=user, submitted_latihan_soal=True).count()

            total_benar = total_benar_tryout + total_benar_latihan
            total_soal = total_soal_tryout + total_soal_latihan
            total_score = round((total_benar / total_soal) * 100, 2) if total_soal else 0

            data.append({
                "rank": i,
                "user_id": user.id,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "photo": request.build_absolute_uri(profile.photo.url) if profile and profile.photo else None,
                "total_benar": total_benar,
                "total_soal": total_soal,
                "total_score": total_score,
                "label": rank_labels.get(i, "PLAYER")
            })
        return Response(data)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def user_stats(request):
    user = request.user

    # ================== LATIHAN (GLOBAL) ==================
    total_latihan = LatihanUserAnswer.objects.filter(
        user=user, submitted_latihan_soal=True
    ).count()

    latihan_benar = LatihanUserAnswer.objects.filter(
        user=user, submitted_latihan_soal=True, is_correct_latihan_soal=True
    ).count()

    latihan_salah = LatihanUserAnswer.objects.filter(
        user=user, submitted_latihan_soal=True, is_correct_latihan_soal=False
    ).count()

    # ================== TRYOUT (GLOBAL) ==================
    total_tryout_jawaban = UserAnswer.objects.filter(
        user=user, submitted=True
    ).count()

    tryout_benar = UserAnswer.objects.filter(
        user=user, submitted=True, is_correct=True
    ).count()

    tryout_salah = UserAnswer.objects.filter(
        user=user, submitted=True, is_correct=False
    ).count()

    tryout_selesai = TryoutSession.objects.filter(
        user=user, finished=True
    ).count()

    # ================== LATIHAN PER MATERI ==================
    from django.db.models import Count, Sum, Case, When, IntegerField

    latihan_per_materi = (
        LatihanUserAnswer.objects
        .filter(user=user, submitted_latihan_soal=True)
        .values("question_latihan_soal__latsol__latihan__judul_materi")
        .annotate(
            total=Count("id"),
            benar=Sum(Case(
                When(is_correct_latihan_soal=True, then=1),
                default=0,
                output_field=IntegerField()
            ))
        )
    )

    latihan_per_materi_data = [
        {
            "materi": r["question_latihan_soal__latsol__latihan__judul_materi"],
            "total": r["total"],
            "benar": r["benar"],
            "salah": r["total"] - r["benar"]
        }
        for r in latihan_per_materi
    ]

    # ================== RESPONSE ==================
    data = {
        # latihan global
        "latihan_total": total_latihan,
        "latihan_benar": latihan_benar,
        "latihan_salah": latihan_salah,

        # tryout global
        "tryout_total": total_tryout_jawaban,
        "tryout_benar": tryout_benar,
        "tryout_salah": tryout_salah,
        "tryout_selesai": tryout_selesai,

        # latihan per materi
        "latihan_per_materi": latihan_per_materi_data
    }

    return Response(data)

class SubscriptionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Subscription.objects.filter(is_active=True)
    serializer_class = HargaSerializer
    permission_classes = [AllowAny]

    def list(self, request, *args, **kwargs):
        subscriptions = self.get_queryset()
        data = []
        now = timezone.now()

        for sub in subscriptions:
            # cek diskon aktif
            active_discount = sub.discounts.filter(
                start_date__lte=now, end_date__gte=now
            ).order_by('-percentage').first()

            harga_final = sub.harga
            # duration_days = sub.duration_days
            diskon_info = None

            if active_discount:
                harga_final = sub.harga - (sub.harga * active_discount.percentage // 100)
                diskon_info = {
                    "id": active_discount.id,
                    "percentage": active_discount.percentage,
                    "start_date": active_discount.start_date,
                    "end_date": active_discount.end_date,
                    "photo": request.build_absolute_uri(active_discount.photo_promo.url) if active_discount.photo_promo else None,

                }

            data.append({
                "id": sub.id,
                "nama": sub.title,
                "duration": sub.duration_days,
                "deskripsi": sub.description,
                "harga_asli": sub.harga,
                "harga_final": harga_final,
                "diskon": diskon_info,
            })

        return Response(data)



# buat diskon baru (opsional, admin-only)
class DiscountCreateView(generics.CreateAPIView):
    queryset = Discount.objects.all()
    serializer_class = serializers.ModelSerializer
    permission_classes = [IsAuthenticated]

    class TempSerializer(serializers.ModelSerializer):
        class Meta:
            model = Discount
            fields = "__all__"

    serializer_class = TempSerializer

class QuoteViewSet(generics.ListAPIView):
    queryset = Quote.objects.all()
    serializer_class = QuoteSerializer

class CountDownViewSet(generics.ListAPIView):
    queryset = CountdownUTBK.objects.all()
    serializer_class = CountdownSerializer
