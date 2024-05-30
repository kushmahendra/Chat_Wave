from django.db import models
from django.contrib.auth.models import AbstractUser

# Create your models here.


def upload_thumbnail(instance, filename):
    path = f"thumbnails/{instance.username}"
    extension = filename.split(".")[-1]
    if extension:
        path = path + "." + extension
    return path

def upload_status(instance, filename):
    path = f"status/{instance.user.username}"
    extension = filename.split('.')[-1]
    if extension:
        path = path + '.' + extension
    return path


class User(AbstractUser):
    thumbnail = models.ImageField(upload_to=upload_thumbnail, null=True, blank=True)
    about = models.CharField(null=True,blank=True,max_length=50)

class Messages(models.Model):
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_messages')
    message = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    def __str__(self):
        formatted_time = self.timestamp.strftime("%I:%M %p")
        return f'{self.sender.username} --> {self.receiver.username} {self.message} {formatted_time}' 

class Status(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='statuses')
    status_file = models.ImageField(upload_to=upload_status, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Status for {self.user.username}"
