# from supabase import create_client, Client
# import os

# _client: Client | None = None

# def get_supabase() -> Client:
#     global _client
#     if _client is None:
#         url = os.getenv("SUPABASE_URL")
#         key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
#         if not url or not key:
#             raise RuntimeError("SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY deben estar configurados.")
#         _client = create_client(url, key)
#     return _client
