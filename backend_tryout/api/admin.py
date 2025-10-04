from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import *

@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    model = CustomUser
    list_display = ("email", "first_name", "last_name", "is_staff", "is_active")
    list_filter = ("is_staff", "is_active")
    search_fields = ("email", "first_name", "last_name")
    ordering = ("email",)
    fieldsets = (
        (None, {"fields": ("email", "username", "password")}),
        ("Personal info", {"fields": ("first_name", "last_name", "phone_number")}),
        ("Permissions", {"fields": ("is_staff", "is_active", "is_superuser", "groups", "user_permissions")}),
    )
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("email", "username", "password1", "password2", "is_staff", "is_active")}
        ),
    )

@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "is_pro", "created_at")

@admin.register(EmailOTP)
class EmailOTPAdmin(admin.ModelAdmin):
    list_display = ("user", "otp", "created_at")


from django.contrib import admin
from .models import Tryout, Question

class QuestionInline(admin.TabularInline):
    model = Question
    extra = 1  # jumlah soal default yang tampil

@admin.register(Tryout)
class TryoutAdmin(admin.ModelAdmin):
    list_display = ("title", "created_at")
    inlines = [QuestionInline]  # bisa langsung tambah soal di page Tryout


admin.site.register(Transaction)
admin.site.register(Materi)
admin.site.register(LatihanSoal)
admin.site.register(Subscription)
admin.site.register(Discount)

admin.site.register(Quote)
admin.site.register(CountdownUTBK)

admin.site.register(UserAnswer)
admin.site.register(TryoutSession)
admin.site.register(TryoutRank)
admin.site.register(TotalRank)
