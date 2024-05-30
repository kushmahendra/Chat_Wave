from channels.generic.websocket import WebsocketConsumer
from asgiref.sync import async_to_sync
import json
from django.shortcuts import get_object_or_404
from .models import User, Messages, Status
from django.db.models import Q
from django.core.paginator import Paginator
import base64
from django.core.files.base import ContentFile
from django.core.serializers.json import DjangoJSONEncoder


class ChatConsumer(WebsocketConsumer):
    online_users = []
    def connect(self):
        
        try:
            user = self.scope["user"]
            print("my username is:", user)
            if not user.is_authenticated:
                return
            self.username = user.username
            async_to_sync(self.channel_layer.group_add)(self.username, self.channel_name)
            async_to_sync(self.channel_layer.group_add)('online_group', self.channel_name)
            # Add the user to the list of online users
            self.online_users.append(self.username)
            self.accept()
            # Notify other users that this user is now online
            self.notify_user_online()
            

        except Exception as e:
            print("An error occurred:", str(e))

    def notify_user_online(self):
        message = {
        "type": "online_users_list",
        "online_users": self.online_users,
        # "online": online
        }   
        print(' i am going to post')
        self.send_group('online_group','online_status',message)

    def disconnect(self, close_code):

        try:
        #     message = {
        #     "type": "user_online_status",
        #     "username": self.username,
        #     "online": False
        # }
         # Remove the user from the list of online users
            self.online_users.remove(self.username)
            self.notify_user_online()
            # self.send_group('online_group','online_status',message)
            async_to_sync(self.channel_layer.group_discard)(
            self.username, self.channel_name
        )
        except Exception as e:
            print('An error occured:', str(e))

    def receive(self, text_data):
        data = json.loads(text_data)
        data_source = data.get("source")
        message_type = data.get("type", "")
        if message_type == "get_user_list":
            query = data.get("query", "")
            users = self.get_filtered_users(query)
            user_list = [
                {
                    "id": user.id,
                    "username": user.username,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "thumbnail_url": user.thumbnail.url if user.thumbnail else None,
                }
                for user in users
            ]
            self.send(text_data=json.dumps({"type": "user_list", "users": user_list}))
        elif data_source == "realtime":
            # Send message to room group
            self.sending_receiving(data)
        elif data_source =='message_typing':
            self.message_typing(data)
        elif data_source == "get_messages" or data_source=="load_more_messages":
            # Send messages list to the frontend
            self.messages_list(data)
        elif data_source == "conversation_list":
            self.conversation_list(data)
        elif data_source == 'message_seen':
            self.mark_as_read(data)
        elif data_source == "file":
            self.upload_photo(data)
        elif data_source == "add_status":
            self.add_status(data)

        elif data_source =='fetch_profile':
            self.fetch_profile(data)
        
        elif data_source == 'fetch_all_status':
            self.fetch_all_status(data)
        
        elif data_source == 'delete_status':
            self.delete_status(data)

        elif data_source =='update_about':
            self.update_about(data)

    def delete_status(self,data):
        status = Status.objects.filter(user=self.scope['user'])
        status.delete()
        self.fetch_all_status(data)


    def fetch_all_status(self, data):
        # status = Status.objects.all()
        status = Status.objects.all().order_by('-created_at')
        # Convert datetime objects to string representations
        status_data = [
        {
            "id": s.id,
            "user": s.user.username,
            "status_file": str(s.status_file),
            "created_at": s.created_at.strftime('%Y-%m-%d %H:%M:%S')
        }
        for s in status
        ]
        response = {
        "status": status_data,
        }
        self.send_group('online_group', 'fetch_all_status', response)

    def update_about(self,data):
        username = self.scope['user']
        about = data.get('about')
        User.objects.filter(username=username).update(about=about)
        
    def fetch_profile(self,data):
        username = data.get('username')
        user_obj = User.objects.get(username=username)
        response = {
            "about":user_obj.about
        }
        self.send_group(self.scope['user'].username,'fetch_profile',response)
    
    def upload_photo(self,data):
        base64_data = data.get("data")
        fileName = data.get("fileName")
        print('filenameis',fileName)
        user = self.scope['user']
        image = ContentFile(base64.b64decode(base64_data))
        user.thumbnail.save(fileName,image,save = True)
        response = {
            "username": user.username,
            "thumbnail":user.thumbnail.url
        }
        self.send_group('online_group','profile_updated',response)

    def add_status(self,data):
        base64_data=data.get('data')
        fileName = data.get("fileName")
        user = self.scope["user"]
        image_data = base64.b64decode(base64_data)
        image = ContentFile(image_data, name=fileName)
        added_status =Status.objects.create(user=user,status_file=image)
        added_status.save()
        self.fetch_all_status(data)

    def mark_as_read(self,data):
        sender= data.get('sender')
        message_sent_by=User.objects.get(username=sender)
        Messages.objects.filter(sender=message_sent_by, receiver=self.scope['user']).update(is_read=True)
        
    def message_typing(self,data):
        user = self.scope['user']
        recipient_username = data.get('username')

        response = {
            'username':user.username
        }
        self.send_group(recipient_username,"message_typing",response)
    def conversation_list(self, data):
        username = data.get("username")
        user = User.objects.get(username=username)
       

        # Get all unique users the authenticated user has interacted with
        sent_conversations = (
            Messages.objects.filter(sender=user)
            .values_list("receiver", flat=True)
            .distinct()
        )
 
        received_conversations = (
            Messages.objects.filter(receiver=user)
            .values_list("sender", flat=True)
            .distinct()
        )
       

        # Combine sent and received conversations to get all unique conversations
        conversations = set(sent_conversations) | set(received_conversations)
        # Retrieve User objects corresponding to the conversation IDs
        users_in_conversations = User.objects.filter(id__in=conversations)
        conversation_list = []
        for other_user_id in conversations:
            other_user = get_object_or_404(User, id=other_user_id)

            # Get the latest message in the conversation
            try:
                # Try to get the latest sent message
                sent_latest = Messages.objects.filter(
                    sender=user, receiver=other_user
                ).latest("timestamp")
            except Messages.DoesNotExist:
                # Handle the case where there are no sent messages
                sent_latest = None

            try:
                # Try to get the latest received message
                received_latest = Messages.objects.filter(
                    sender=other_user, receiver=user
                ).latest("timestamp")
            except Messages.DoesNotExist:
                # Handle the case where there are no received messages
                received_latest = None

            # Count unread messages
            unread_count = Messages.objects.filter(
            receiver=user, sender=other_user, is_read=False
            ).count()

            # Check which message is more recent
            if sent_latest is not None and (
                received_latest is None
                or sent_latest.timestamp > received_latest.timestamp
            ):
                latest_message = sent_latest
                sent_by = "sender"
            elif received_latest is not None:
                latest_message = received_latest
                sent_by = "receiver"
            else:
                # Handle the case where there are no messages between the two users
                latest_message = None
                sent_by = None

            # Construct the conversation info based on the latest message
            if latest_message:
                last_message_info = {
                    "text": latest_message.message,
                    "sent_by": sent_by,
                    # "time": latest_message.timestamp,
                    'time': latest_message.timestamp.isoformat() if latest_message.timestamp else None
                }
                conversation_info = {
                    "user_id": other_user_id,
                    "username": other_user.username,
                    "last_message": last_message_info,
                    "thumbnail_url" : other_user.thumbnail.url if other_user.thumbnail else None,
                    "unread_count": unread_count



                }
                conversation_list.append(conversation_info)
            conversation_list.sort(key=lambda x: x['last_message']['time'], reverse=True)
        return self.send_group(username, "conversation_list", conversation_list)

    def messages_list(self, data):
        receiver = data.get("receiver")
        sender = data.get("sender")
        page_number = data.get("page_number", 0)
        page_size = data.get("page_size", 10)

        sender_user = User.objects.get(username=sender)
        receiver_user = User.objects.get(username=receiver)
        print('hello',data)

        if data.get("source") == "load_more_messages":
            print('good')
            last_message_timestamp = data.get("last_message_timestamp")
            # Fetch older messages based on the last message timestamp
            print(data.get('page_number'))
            messages = Messages.objects.filter(
                (Q(sender=sender_user) & Q(receiver=receiver_user)) |
                (Q(sender=receiver_user) & Q(receiver=sender_user)),
                timestamp__lt=last_message_timestamp
            ).order_by('-timestamp')[page_number * page_size:(page_number + 1) * page_size]
            print(messages,'from load_more_messsages')
        else:
            # Fetch initial messages
            messages = Messages.objects.filter(
                (Q(sender=sender_user) & Q(receiver=receiver_user)) |
                (Q(sender=receiver_user) & Q(receiver=sender_user))
            ).order_by('-timestamp')[page_number * page_size:(page_number + 1) * page_size]
            print(messages,'from get_messages')
            print('page_number',page_number)

        # Pagination
        paginator = Paginator(messages, page_size)
        page_obj = paginator.get_page(page_number)
        print('no of pages: ',page_obj)

        # Prepare response
        response = {
        "sender": sender,
        "receiver": receiver,
        "page_number": page_obj.number,
        "num_pages": page_obj.paginator.num_pages,
        "has_next": page_obj.has_next(),
        "has_previous": page_obj.has_previous(),
        "messages": []
        }

        for message in page_obj:
            if str(message.sender) == sender:
                message_info = {
                    "message": message.message,
                    "timestamp": str(message.timestamp),
                    "sent_by": sender,
                }
            else:
                message_info = {
                    "message": message.message,
                    "sent_by": receiver,
                    "timestamp": str(message.timestamp),
                }
            response["messages"].append(message_info)

        self.send_group(sender, "get_messages", response)
        # self.send_group(receiver, "get_messages", response)

    def sending_receiving(self, data):
        receiver = data.get("receiver")
        sender = data.get("sender")
        message = data.get("message")
        sender_user = User.objects.get(username=sender)
        receiver_user = User.objects.get(username=receiver)
        Messages.objects.create(
            sender=sender_user, receiver=receiver_user, message=message
        )
        if sender == str(self.scope["user"]):
            self.send_group(receiver, "realtime", data)
            return
        self.send_group(sender, "realtime", data)

    def get_filtered_users(self, query):
        if query:
            users = User.objects.filter(
                Q(username__istartswith=query) | Q(first_name__istartswith=query)
            )
        else:
            users = User.objects.all()

        return users

    def send_group(self, group, source, data):
        response = {"type": "broadcast_group", "source": source, "data": data}
        async_to_sync(self.channel_layer.group_send)(group, response)

    def broadcast_group(self, data):
        """
        data:
                - type: 'broadcast_group'
                - source: where it originated from
                - data: what ever you want to send as a dict
        """
        data.pop("type")

        """
		return data:
			- source: where it originated from
			- data: what ever you want to send as a dict
		"""
        self.send(text_data=json.dumps(data))
