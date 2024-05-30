from django.contrib import admin
from .models import User,Messages,Status


# Register your models here.
admin.site.register(User)
admin.site.register(Messages)
admin.site.register(Status)