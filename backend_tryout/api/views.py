from django.shortcuts import render

# Create your views here.
from .models import CustomUser
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import *
from rest_framework.response import Response
from rest_framework import generics, permissions, status
from django.core.cache import cache
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import AllowAny

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
    serializer = PasswordResetRequestSerializer(data=request.data)
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


class SubscriptionView(generics.ListAPIView):
    serializer_class = HargaSerializer

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
        answers = UserAnswer.objects.filter(
            user=request.user,
            question__tryout_id=tryout_id,
            submitted=True
        )

        total = answers.count()
        correct = answers.filter(is_correct=True).count()
        wrong = total - correct

        return Response({
            "tryout_id": tryout_id,
            "total": total,
            "correct": correct,
            "wrong": wrong
        })


   
class SubmitTryoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, tryout_id):
        answers = request.data  # {question_id: "A", ...}
        results = []

        for q_id, selected in answers.items():
            ua, _ = UserAnswer.objects.get_or_create(
                user=request.user,
                question_id=q_id
            )
            ua.selected_option = selected
            ua.submitted = True
            ua.is_correct = (ua.question.answer == selected)
            ua.save()

            results.append({
                "question_id": q_id,
                "selected": selected,
                "correct": ua.question.answer,
                "is_correct": ua.is_correct,
                "answered_at": ua.answered_at
            })

        return Response({
            "tryout_id": tryout_id,
            "results": results
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
            # Menyimpan atau mengambil jawaban dari User
            ua, created = LatihanUserAnswer.objects.get_or_create(
                user=request.user,
                question_latihan_soal_id=question_id
            )
            ua.selected_option_latihan_soal = selected
            ua.submitted_latihan_soal = True
            # Mengecek apakah jawaban benar
            ua.is_correct_latihan_soal = (ua.question_latihan_soal.answer_latihan == selected)
            ua.save()

            results.append({
                "question_id": question_id,
                "selected": selected,
                "correct": ua.question_latihan_soal.answer_latihan,
                "is_correct": ua.is_correct_latihan_soal,
                "answered_at": ua.answered_at_latihan_soal
            })

        return Response({
            "latihan_id": latihan_id,
            "results": results
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


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_transaction(request):
    user = request.user
    amount = int(request.data.get("amount", 100000))  # default 100k

    order_id = f"order-{user.id}-{uuid.uuid4().hex[:8]}"

    # simpan transaction di DB
    trx = Transaction.objects.create(
        user=user,
        order_id=order_id,
        amount=amount,
        status="pending"
    )

    # setup Midtrans Snap
    snap = midtransclient.Snap(
        is_production=False,
        server_key=settings.MIDTRANS_SERVER_KEY,
        client_key=settings.MIDTRANS_CLIENT_KEY
    )

    param = {
        "transaction_details": {
            "order_id": order_id,
            "gross_amount": amount,
        },
        "customer_details": {
            "first_name": user.first_name or "Guest",
            "email": user.email,
        }
    }

    transaction = snap.create_transaction(param)

    return Response({
        "order_id": trx.order_id,
        "token": transaction["token"],
        "redirect_url": transaction["redirect_url"]
    })


@api_view(["POST"])
@permission_classes([AllowAny])  # Midtrans bisa akses tanpa login
def payment_notification(request):
    notif = request.data
    order_id = notif.get("order_id")
    transaction_status = notif.get("transaction_status")

    if not order_id or not transaction_status:
        return Response({"status": "error", "message": "Missing order_id or transaction_status"}, status=400)

    try:
        trx = Transaction.objects.get(order_id=order_id)
        trx.status = transaction_status
        trx.save()

        profile, _ = Profile.objects.get_or_create(user=trx.user)

        if transaction_status == "settlement":
            profile.is_pro = True
            profile.save()
            return Response({"status": "success", "message": "User upgraded to PRO"})

        elif transaction_status in ["cancel", "deny", "expire"]:
            profile.is_pro = False
            profile.save()
            return Response({"status": "failed", "message": "Payment failed"})

        else:
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
    queryset = TotalRank.objects.all().order_by("-total_score")
    serializer_class = TotalRankSerializer
    permission_classes = [IsAuthenticated]