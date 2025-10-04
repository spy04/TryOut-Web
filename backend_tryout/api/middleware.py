# from django.utils import timezone

# class CheckProStatusMiddleware:
#     def __init__(self, get_response):
#         self.get_response = get_response

#     def __call__(self, request):
#         if request.user.is_authenticated:
#             print("Middleware check:", request.user.email)
#             profile = request.user.profile
#             print("End date:", profile.end_date, "is_pro before:", profile.is_pro)
#             if profile.is_pro and profile.end_date and timezone.now() > profile.end_date:
#                 profile.is_pro = False
#                 profile.save()
#                 print("is_pro set to False")

#         response = self.get_response(request)
#         return response
