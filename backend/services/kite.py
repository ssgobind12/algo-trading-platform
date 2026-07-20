from kiteconnect import KiteConnect
from backend.config import settings

def get_kite_instance(access_token=None):
    kite = KiteConnect(api_key=settings.KITE_API_KEY)
    if access_token:
        kite.set_access_token(access_token)
    return kite
