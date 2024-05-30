"""
ASGI config for backend project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.0/howto/deployment/asgi/
"""

import os
import authentication.routing
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
# from django_channels_jwt_auth_middleware.auth import JWTAuthMiddlewareStack
from authentication.middlewares.CustomMiddleware import JWTAuthMiddlewareStack

from django.core.asgi import get_asgi_application
# from  authentication.middlewares.CustomMiddleware import CustomAuthMiddleware

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

# application = get_asgi_application()
application = ProtocolTypeRouter({
    'http': get_asgi_application(),
    'websocket': AllowedHostsOriginValidator(
        # CustomAuthMiddleware(
            JWTAuthMiddlewareStack(
                URLRouter(
                    authentication.routing.websocket_urlpatterns
                )
            )
        # )
    ),
})
