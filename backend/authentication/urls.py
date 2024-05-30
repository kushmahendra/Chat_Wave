from django.urls import path
from .views import *
from django.contrib.auth.views import LoginView


urlpatterns = [
    path("", HomeView.as_view(), name="home"),
    path('logout/', LogoutView.as_view(), name ='logout'),
    path('signup/',UserRegistrationView.as_view(),name='signup')
]
