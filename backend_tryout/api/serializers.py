from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from .models import *
from .utils import send_otp_email, send_password_reset_email
from django.contrib.auth import authenticate
from django.contrib.auth.hashers import check_password
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode



User = get_user_model()

from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()




class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        if not User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email tidak ditemukan")
        return value

    def save(self):
        user = User.objects.get(email=self.validated_data['email'])
        token = PasswordResetTokenGenerator().make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        reset_link = f"{settings.FRONTEND_URL}reset-password/{uid}/{token}/"

        # ambil IP & device dari context
        request = self.context.get("request")
        ip = request.META.get("REMOTE_ADDR") if request else "Unknown IP"
        device = request.META.get("HTTP_USER_AGENT") if request else "Unknown device"

        send_password_reset_email(user, reset_link, ip, device)
        return {"message": "Link reset password sudah dikirim ke email"}



class SetNewPasswordSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True, min_length=6)

    def validate(self, attrs):
        try:
            uid = force_str(urlsafe_base64_decode(attrs['uid']))
            user = User.objects.get(pk=uid)
        except (User.DoesNotExist, ValueError, TypeError):
            raise serializers.ValidationError("Link reset tidak valid")

        if not PasswordResetTokenGenerator().check_token(user, attrs['token']):
            raise serializers.ValidationError("Token tidak valid atau sudah kadaluarsa")

        attrs['user'] = user
        return attrs

    def save(self):
        user = self.validated_data['user']
        user.set_password(self.validated_data['new_password'])
        user.save()
        return {"message": "Password berhasil direset"}
    
class RegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ["first_name", "last_name", "phone_number", "email", "password"]
        extra_kwargs = {"password": {"write_only": True}}

    def create(self, validated_data):
        user = CustomUser(
            email=validated_data["email"],
            username=validated_data["email"],
            first_name=validated_data.get("first_name", ""),
            last_name=validated_data.get("last_name", ""),
            phone_number=validated_data.get("phone_number", ""),
            is_active=False,  # <--- user belum aktif
        )
        user.set_password(validated_data["password"])
        user.save()

        # kirim OTP
        otp = send_otp_email(user.email)
        EmailOTP.objects.create(user=user, otp=otp)

        return user
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        try:
            user = User.objects.get(email=attrs.get("email"))
        except User.DoesNotExist:
            raise serializers.ValidationError({"detail": ["Email atau password salah"]})

        # cek password manual
        if not check_password(attrs.get("password"), user.password):
            raise serializers.ValidationError({"detail": ["Email atau password salah"]})

        if not user.is_active:
            return {
                "detail": "Akun belum aktif, silakan verifikasi OTP terlebih dahulu.",
                "need_otp": True,
                "email": user.email
            }

        # user aktif → generate token
        data = super().validate(attrs)
        data.update({
            "email": user.email,
            "is_pro": getattr(user.profile, "is_pro", False)
        })
        return data

    
class VerifyOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6)

    def validate(self, attrs):
        from .models import EmailOTP
        try:
            user = User.objects.get(email=attrs["email"])
            otp_obj = EmailOTP.objects.get(user=user)
        except (User.DoesNotExist, EmailOTP.DoesNotExist):
            raise serializers.ValidationError("User atau OTP tidak valid")

        if otp_obj.is_expired():
            raise serializers.ValidationError("OTP sudah kadaluarsa")

        if otp_obj.otp != attrs["otp"]:
            raise serializers.ValidationError("OTP salah")

        # kalau sukses, aktifkan user
        user.is_active = True
        user.save()
        otp_obj.delete()

        # tambahin user ke validated_data
        attrs["user"] = user
        return attrs

    
class ResendOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()


class TryoutSerializer(serializers.ModelSerializer):
    finished = serializers.SerializerMethodField()
    question_count = serializers.SerializerMethodField()


    class Meta:
        model = Tryout
        fields = ["id", "title", "description", "duration", "finished", "question_count"]

    def get_finished(self, obj):
        user = self.context["request"].user
        session = TryoutSession.objects.filter(user=user, tryout=obj).first()
        return session.finished if session else False
    
    def get_question_count(self, obj):
        return obj.questions.count()


class TryoutSessionSerializer(serializers.ModelSerializer):
    remaining_time = serializers.SerializerMethodField()

    class Meta:
        model = TryoutSession
        fields = ['id', 'tryout', 'start_date', 'finished', 'remaining_time']

    def get_remaining_time(self, obj):
        return obj.remaining_time()
    

class UserAnswerReviewSerializer(serializers.ModelSerializer):
    question_text = serializers.CharField(source="question.text", read_only=True)
    correct_choice = serializers.CharField(source="question.answer", read_only=True)

    class Meta:
        model = UserAnswer
        fields = [
            "id",
            "question_text",
            "selected_option",   # jawaban user
            "correct_choice",    # jawaban benar
            "is_correct",
        ]
class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ['photo','gender', 'bio', 'asal_sekolah', 'Jurusan', 'tahun_lulus', 'is_pro', 'end_date', 'start_date']




class UserDetailSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer()

    class Meta:
        model = CustomUser
        fields = ['username', 'first_name', 'last_name', 'email', 'phone_number', 'profile']

    def update(self, instance, validated_data):
        # Update profile dulu
        profile_data = validated_data.pop('profile', None)
        if profile_data:
            profile_serializer = ProfileSerializer(instance.profile, data=profile_data, partial=True)
            profile_serializer.is_valid(raise_exception=True)
            profile_serializer.save()

        # Update user
        return super().update(instance, validated_data)
    
    



class QuestionSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(use_url=True, required=False)
    option_a_image = serializers.ImageField(use_url=True, required=False)
    option_b_image = serializers.ImageField(use_url=True, required=False)
    option_c_image = serializers.ImageField(use_url=True, required=False)
    option_d_image = serializers.ImageField(use_url=True, required=False)
    option_e_image = serializers.ImageField(use_url=True, required=False)
    explanation_image = serializers.ImageField(use_url=True, required=False)

    class Meta:
        model = Question
        fields = '__all__'


class DraftAnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserAnswer
        fields = ['question', 'selected_option']

    def create(self, validated_data):
        user = self.context['request'].user
        obj, created = UserAnswer.objects.update_or_create(
            user=user,
            question=validated_data['question'],
            defaults={'selected_option': validated_data['selected_option'], 'submitted': False}
        )
        return obj

class FinalSubmitSerializer(serializers.Serializer):
    def save(self, **kwargs):
        user = self.context['request'].user
        drafts = UserAnswer.objects.filter(user=user, submitted=False).select_related('question')
        total_correct = 0
        total_questions = drafts.count()
        details = []
        objs_to_update = []

        for draft in drafts:
            draft.is_correct = (draft.selected_option == draft.question.answer)
            draft.submitted = True
            if draft.is_correct:
                total_correct += 1
            objs_to_update.append(draft)
            details.append({
                "question_id": draft.question.id,
                "selected_option": draft.selected_option,
                "is_correct": draft.is_correct,
                "explanation": draft.question.explanation
            })

        UserAnswer.objects.bulk_update(objs_to_update, ['is_correct', 'submitted'])

        return {
            "total_questions": total_questions,
            "correct": total_correct,
            "wrong": total_questions - total_correct,
            "details": details
        }
    
    


class PracticeTestSerializer(serializers.ModelSerializer):
    class Meta:
        model = PracticeTest
        fields = '__all__'


class MateriSerializer(serializers.ModelSerializer):
   
    class Meta:
        model = Materi
        fields = ['id', 'judul_materi', 'slug_materi', 'konten_materi', 'image_materi', 'practicetest']

   




class LatihanSoalSerializer(serializers.ModelSerializer):
    image_latihan = serializers.ImageField(use_url=True, required=False)
    option_a_image_latihan = serializers.ImageField(use_url=True, required=False)
    option_b_image_latihan = serializers.ImageField(use_url=True, required=False)
    option_c_image_latihan = serializers.ImageField(use_url=True, required=False)
    option_d_image_latihan = serializers.ImageField(use_url=True, required=False)
    option_e_image_latihan = serializers.ImageField(use_url=True, required=False)
    explanation_image_latihan = serializers.ImageField(use_url=True, required=False)

    materi = serializers.SerializerMethodField()
    kategori = serializers.SerializerMethodField()

    class Meta:
        model = LatihanSoal
        fields = '__all__'

    def get_materi(self, obj):
        if obj.latsol and obj.latsol.latihan:  # latsol = Latihan, latihan = Materi
            return {
                "id": obj.latsol.latihan.id,
                "judul_materi": obj.latsol.latihan.judul_materi,
            }
        return None



    def get_kategori(self, obj):
        if obj.latsol and obj.latsol.latihan and obj.latsol.latihan.practicetest:
            return {
                "id": obj.latsol.latihan.practicetest.id,
                "title_practice": obj.latsol.latihan.practicetest.title_practice,
            }
        return None

class LatihanSerializer(serializers.ModelSerializer):
    
    materi = MateriSerializer(source='latihan', read_only=True)  # FK ke Materi
    soal = LatihanSoalSerializer(source='latsol', many=True, read_only=True)  # FK soal
    kategori = serializers.SerializerMethodField()  # ambil kategori via materi → practicetest

    class Meta:
        model = Latihan
        fields = ['id', 'title_latihan', 'kategori', 'materi', 'soal']

    def get_kategori(self, obj):
        if obj.latihan and obj.latihan.practicetest:
            return {
                "id": obj.latihan.practicetest.id,
                "title_practice": obj.latihan.practicetest.title_practice,
            }
        return None


class SubmitAnswerSerializer(serializers.Serializer):
    question_id = serializers.IntegerField()
    selected_option = serializers.CharField(max_length=1)

    def validate(self, data):
        try:
            question = LatihanSoal.objects.get(id=data['question_id'])
        except LatihanSoal.DoesNotExist:
            raise serializers.ValidationError("Question not found")
        data['question'] = question
        return data

    def save(self, **kwargs):
        request = self.context.get('request')  # biar bisa dapet user
        question = self.validated_data['question']
        selected = self.validated_data['selected_option'].upper()

        is_correct = (selected == question.answer_latihan)

        # simpan ke jawaban user
        LatihanUserAnswer.objects.update_or_create(
            user=request.user,
            question_latihan_soal=question,
            defaults={
                "selected_option_latihan_soal": selected,
                "is_correct_latihan_soal": is_correct,
                "submitted_latihan_soal": True
            }
        )

        return {
            "question_id": question.id,
            "materi": question.latsol.latihan.judul_materi,  # <<--- akses ke materi
            "selected_option": selected,
            "is_correct": is_correct,
            "explanation": question.explanation_latihan or "No explanation available",
            "explanation_image": question.explanation_image_latihan.url if question.explanation_image_latihan else None
        }



#ADMIN

class TryoutUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tryout
        fields = "__all__"

    def create(self, validated_data):
        return Tryout.objects.create(**validated_data)

class QuestionUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = "__all__"

    extra_kwargs = {
            "image": {"required": False},
            "option_a_image": {"required": False},
            "option_b_image": {"required": False},
            "option_c_image": {"required": False},
            "option_d_image": {"required": False},
            "option_e_image": {"required": False},
            "explanation": {"required": False},
            "explanation_image": {"required": False},
        }

    def create(self, validated_data):
        return Question.objects.create(**validated_data)
    



class PracticeTestUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = PracticeTest
        fields = "__all__"
    
    def create(self, validated_data):
        return PracticeTest.objects.create(**validated_data)
    
class MateriUploadSerializer(serializers.ModelSerializer):
    practicetest = serializers.PrimaryKeyRelatedField(
        queryset=PracticeTest.objects.all()
    )

    class Meta:
        model = Materi
        fields = "__all__"
        extra_kwargs = {
            "image_materi": {"required": False},  # sesuaikan nama field image-mu
        }

    # create() default dari ModelSerializer sudah cukup, gak perlu override


 
    
class LatihanUploadSerializer(serializers.ModelSerializer):
    latihan = serializers.PrimaryKeyRelatedField(
        queryset=Materi.objects.all()
    )

    class Meta:
        model = Latihan
        fields = "__all__"

    def create(self, validated_data):
        return Latihan.objects.create(**validated_data)

class LatihanSoalUploadSerializer(serializers.ModelSerializer):
    latsol = serializers.PrimaryKeyRelatedField(queryset=Latihan.objects.all())

    class Meta:
        model = LatihanSoal
        fields = "__all__"
        extra_kwargs = {
            "image_latihan": {"required": False},
            "option_a_image_latihan": {"required": False},
            "option_b_image_latihan": {"required": False},
            "option_c_image_latihan": {"required": False},
            "option_d_image_latihan": {"required": False},
            "option_e_image_latihan": {"required": False},
            "explanation_latihan": {"required": False},
            "explanation_image_latihan": {"required": False},
        }

    def create(self, validated_data):
        return LatihanSoal.objects.create(**validated_data)
    
class TryoutRankSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source="user.email", read_only=True)
    tryout_title = serializers.CharField(source="tryout.title", read_only=True)

    class Meta:
        model = TryoutRank
        fields = ["id", "user", "user_email", "tryout", "tryout_title", "score", "created_at"]


class TotalRankSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source="user.email", read_only=True)

    class Meta:
        model = TotalRank
        fields = ["id", "user", "user_email", "total_score", "updated_at"]


class HargaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subscription
        fields = '__all__'

class DiscountSerializer(serializers.ModelSerializer):
    class Meta:
        model = Discount
        fields = '__all__'


class QuoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Quote
        fields = '__all__'

class CountdownSerializer(serializers.ModelSerializer):
    class Meta:
        model = CountdownUTBK
        fields = '__all__'

class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = '__all__'