from django.db import models

# Create your models here.
from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
from django.db.models.signals import post_save
from django.dispatch import receiver
import datetime
from ckeditor_uploader.fields import RichTextUploadingField
from django.utils.text import slugify
from datetime import timedelta




from django.contrib.auth.models import AbstractUser, BaseUserManager

class CustomUserManager(BaseUserManager):
    use_in_migrations = True

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Email must be set")
        email = self.normalize_email(email)
        user = self.model(email=email, username=email, **extra_fields)  # auto username = email
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
        return self.create_user(email, password, **extra_fields)


class CustomUser(AbstractUser):
    email = models.EmailField(unique=True)
    phone_number = models.CharField(max_length=15, blank=True, null=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []  # username tidak wajib lagi

    objects = CustomUserManager()  # pakai manager baru

    def __str__(self):
        return self.email

    
class Profile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    gender = models.CharField(null=True, blank=True, max_length=10)
    photo = models.ImageField(upload_to='profile_photos/', blank=True, null=True)
    bio = models.TextField(blank=True, null=True)
    asal_sekolah = models.CharField(blank=True, null=True, max_length=255)
    Jurusan = models.CharField(blank=True, null=True, max_length=255)
    tahun_lulus = models.DateField(blank=True, null=True)
    is_pro = models.BooleanField(default=False)
    start_date = models.DateTimeField(null=True, blank=True)
    end_date = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.user.email
    
    
    

@receiver(post_save, sender=CustomUser)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        from .models import Profile
        Profile.objects.create(user=instance)
    

class EmailOTP(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    otp = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)

    def is_expired(self):
        return timezone.now() > self.created_at + datetime.timedelta(minutes=5)  # expired 5 menit
    

class Tryout(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    duration = models.PositiveIntegerField(default=160)  # menit
    start_time = models.DateTimeField(blank=True, null=True)
    end_time = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title}"

   

class Question(models.Model):
    tryout = models.ForeignKey(Tryout, on_delete=models.CASCADE, related_name='questions')
    text = models.TextField()
    image = models.ImageField(upload_to='question_images/', blank=True, null=True)  # gambar soal
    option_a = models.CharField(max_length=255, null=True, blank=True)
    option_a_image = models.ImageField(upload_to='option_images/', blank=True, null=True)  # gambar pilihan
    option_b = models.CharField(max_length=255, null=True, blank=True)
    option_b_image = models.ImageField(upload_to='option_images/', blank=True, null=True)
    option_c = models.CharField(max_length=255, null=True, blank=True)
    option_c_image = models.ImageField(upload_to='option_images/', blank=True, null=True)
    option_d = models.CharField(max_length=255, null=True, blank=True)
    option_d_image = models.ImageField(upload_to='option_images/', blank=True, null=True)
    option_e = models.CharField(max_length=255, null=True, blank=True)
    option_e_image = models.ImageField(upload_to='option_images/', blank=True, null=True)
    answer = models.CharField(max_length=1)  # A/B/C/D
    explanation = models.TextField(blank=True, null=True)
    explanation_image = models.ImageField(upload_to='explanation_images/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.tryout.title} - {self.text[:50]}"

class TryoutSession(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    tryout = models.ForeignKey(Tryout, on_delete=models.CASCADE)
    start_date = models.DateTimeField(default=timezone.now)
    finished = models.BooleanField(default=False)

    class Meta:
        unique_together = ('user', 'tryout')

    def remaining_time(self):
        """Menghitung sisa waktu untuk user ini"""
        return max(
            0,
            int((self.start_date + timedelta(minutes=self.tryout.duration) - timezone.now()).total_seconds())
        )

    def is_expired(self):
        return self.remaining_time() <= 0

    def __str__(self):
        return f"{self.user.email} - {self.tryout.title}"


class UserAnswer(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    selected_option = models.CharField(max_length=1)  # A/B/C/D
    is_correct = models.BooleanField(null=True)       # dihitung pas final submit
    answered_at = models.DateTimeField(auto_now=True)
    submitted = models.BooleanField(default=False)    # draft atau final

    class Meta:
        unique_together = ('user', 'question')

    def __str__(self):
        return f"{self.user} - {self.question.id} - {self.selected_option}"
    

class PracticeTest(models.Model):
    title_practice = models.CharField(max_length=255)
    created_at_practice = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title_practice
    
class Materi(models.Model):
    practicetest = models.ForeignKey(PracticeTest, on_delete=models.CASCADE, related_name='materi')
    judul_materi = models.CharField(max_length=200)
    slug_materi = models.SlugField(unique=True, blank=True)  # buat URL /materi/judul
    konten_materi = RichTextUploadingField(null=True, blank=True)# bisa pakai editor rich text
    image_materi = models.ImageField(upload_to='materi_image/', blank=True, null=True)
    created_at_materi = models.DateTimeField(auto_now_add=True)
    updated_at_materi = models.DateTimeField(auto_now=True)


    def save(self, *args, **kwargs):
        if not self.slug_materi:
            self.slug_materi = slugify(self.judul_materi)
        super().save(*args, **kwargs)
    def __str__(self):
        return self.judul_materi
    
class Latihan(models.Model):
    latihan = models.ForeignKey(Materi, on_delete=models.CASCADE, related_name='latihan')
    title_latihan = models.CharField(max_length=255)
    created_at_latihan = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title_latihan


class LatihanSoal(models.Model):
    latsol = models.ForeignKey(Latihan, on_delete=models.CASCADE, related_name='latsol')
    text_latihan = models.TextField()
    image_latihan = models.ImageField(upload_to='question_images/', blank=True, null=True)  # gambar soal
    option_a_latihan = models.CharField(max_length=255, null=True, blank=True)
    option_a_image_latihan = models.ImageField(upload_to='option_images/', blank=True, null=True)  # gambar pilihan
    option_b_latihan = models.CharField(max_length=255, null=True, blank=True)
    option_b_image_latihan = models.ImageField(upload_to='option_images/', blank=True, null=True)
    option_c_latihan = models.CharField(max_length=255, null=True, blank=True)
    option_c_image_latihan = models.ImageField(upload_to='option_images/', blank=True, null=True)
    option_d_latihan = models.CharField(max_length=255, null=True, blank=True)
    option_d_image_latihan = models.ImageField(upload_to='option_images/', blank=True, null=True)
    option_e_latihan = models.CharField(max_length=255, null=True, blank=True)
    option_e_image_latihan = models.ImageField(upload_to='option_images/', blank=True, null=True)
    answer_latihan = models.CharField(max_length=1)  # A/B/C/D
    explanation_latihan = models.TextField(blank=True, null=True)
    explanation_image_latihan = models.ImageField(upload_to='explanation_images/', blank=True, null=True)
    created_at_latihan = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.latsol.title_latihan} - {self.text_latihan[:50]}"
    

class LatihanUserAnswer(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    question_latihan_soal = models.ForeignKey(LatihanSoal, on_delete=models.CASCADE)
    selected_option_latihan_soal = models.CharField(max_length=1)  # A/B/C/D
    is_correct_latihan_soal = models.BooleanField(null=True)       # dihitung pas final submit
    answered_at_latihan_soal = models.DateTimeField(auto_now=True)
    submitted_latihan_soal = models.BooleanField(default=False)    # draft atau final

    class Meta:
        unique_together = ('user', 'question_latihan_soal')

    def __str__(self):
        return f"{self.user} - {self.question_latihan_soal.id} - {self.selected_option_latihan_soal}"
    

class Transaction(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("settlement", "Settlement"),
        ("deny", "Deny"),
        ("expire", "Expire"),
        ("cancel", "Cancel"),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="transactions")
    subscription = models.ForeignKey("Subscription", on_delete=models.SET_NULL, null=True, blank=True, related_name="transactions")  
    order_id = models.CharField(max_length=100, unique=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    start_date = models.DateTimeField(null=True, blank=True)
    end_date = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.email} - {self.subscription} - {self.status}"

    
class Subscription(models.Model):
    title = models.CharField(max_length=100, null=True, blank=True)
    harga = models.IntegerField(null=True, blank=True)
    harga_bulan = models.IntegerField(null=True, blank=True)
    duration_days = models.IntegerField(default=30)
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.title or f"Subscription #{self.id}"

class Discount(models.Model):
    subscription = models.ForeignKey(Subscription, on_delete=models.CASCADE, related_name="discounts")
    percentage = models.IntegerField(null=True, blank=True)  # misal 10 berarti 10%
    start_date = models.DateTimeField(null=True, blank=True)
    end_date = models.DateTimeField(null=True, blank=True)
    photo_promo = models.ImageField(upload_to='promo/', blank=True, null=True)

    def is_valid(self):
        from django.utils import timezone
        now = timezone.now()
        return self.start_date <= now <= self.end_date

    def __str__(self):
        return f"{self.percentage}% for {self.subscription.title}"
 

class TryoutRank(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    tryout = models.ForeignKey("Tryout", on_delete=models.CASCADE, related_name="ranks")
    score = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'tryout')
        ordering = ['-score']  # otomatis urut score tinggi ke rendah

    def __str__(self):
        return f"{self.user.email} - {self.tryout.title} - {self.score}"


class TotalRank(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="total_rank")
    total_score = models.IntegerField(default=0)  # kumulatif dari semua soal (tryout + latihan)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-total_score']

    def __str__(self):
        return f"{self.user.email} - {self.total_score}"
    

class Quote(models.Model):
    nama = models.CharField(max_length=100)
    isi = models.CharField(max_length=500)

    def __str__(self):
        return self.nama

class CountdownUTBK(models.Model):
    dateUTBK = models.DateField()
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return str(self.dateUTBK)  # atau self.dateUTBK.strftime("%Y-%m-%d")

    
class Event(models.Model):
    title = models.CharField(max_length=100)    
    poster = models.ImageField(upload_to='poster/')
    photo = models.ImageField(upload_to='photo_event')
    start_date = models.DateField()
    end_date = models.DateField()
    time = models.IntegerField()
    tempat = models.CharField(max_length=255)
    syarat = models.TextField()

    def __str__(self):
        return self.title