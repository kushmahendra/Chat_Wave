import traceback
from urllib.parse import parse_qs

from channels.auth import AuthMiddlewareStack
from channels.db import database_sync_to_async
from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from django.db import close_old_connections
from jwt import decode as jwt_decode
from jwt import InvalidSignatureError, ExpiredSignatureError, DecodeError
from oauth2_provider.models import AccessToken

User = get_user_model()


class JWTAuthMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        close_old_connections()
        try:
            query_params = parse_qs(scope["query_string"].decode("utf8"))
            token_type = query_params.get('token_type', [''])[0]
            token_value = query_params.get('token', [''])[0]
            if token_type == 'jwt':
                # Handle JWT token
                jwt_payload = self.get_payload(token_value)
                user_credentials = self.get_user_credentials(jwt_payload)
                user = await self.get_logged_in_user(user_credentials)
                scope['user'] = user
            elif token_type == 'google-oauth':
                # Handle Google OAuth token
                # import pdb
                access_token = await self.get_access_token(token_value)
                print('my user id',access_token.user_id)
                if access_token:
                    user_id = access_token.user_id
                    try:
                        user = await self.get_logged_in_user(user_id)
                    except User.DoesNotExist:
                        user = AnonymousUser()
                else:
                    user = AnonymousUser()

                scope['user'] = user
        except (InvalidSignatureError, KeyError, ExpiredSignatureError, DecodeError):
            traceback.print_exc()
            scope['user'] = AnonymousUser()
        except:
            scope['user'] = AnonymousUser()
        return await self.app(scope, receive, send)
    

    def get_payload(self, jwt_token):
        payload = jwt_decode(
            jwt_token, settings.SECRET_KEY, algorithms=["HS256"])
        return payload

    def get_user_credentials(self, payload):
        """
        Method to get user credentials from JWT token payload.
        Defaults to user ID.
        """
        user_id = payload['user_id']
        return user_id

    @database_sync_to_async
    def get_logged_in_user(self, user_id):
        try:
            return User.objects.get(id=user_id)
        except User.DoesNotExist:
            return AnonymousUser()
        
    @database_sync_to_async
    def get_access_token(self, access_token):
        try:
            return AccessToken.objects.get(token=access_token)
        except AccessToken.DoesNotExist:
            print("Access token not found:", access_token)
            return None


def JWTAuthMiddlewareStack(app):
    return JWTAuthMiddleware(AuthMiddlewareStack(app))