import midtransclient
from django.conf import settings

def get_snap_client():
    return midtransclient.Snap(
        is_production=settings.MIDTRANS_IS_PRODUCTION,
        server_key=settings.MIDTRANS_SERVER_KEY,
        client_key=settings.MIDTRANS_CLIENT_KEY
    )

def create_transaction(order_id, amount, customer_name, customer_email):
    snap = get_snap_client()

    param = {
        "transaction_details": {
            "order_id": order_id,
            "gross_amount": amount,
        },
        "customer_details": {
            "first_name": customer_name,
            "email": customer_email,
        },
    }

    transaction = snap.create_transaction(param)
    return transaction
