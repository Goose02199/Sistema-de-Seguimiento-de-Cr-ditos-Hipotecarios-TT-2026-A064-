import os
from cryptography.fernet import Fernet
from django.conf import settings

# Inicializamos el motor criptográfico usando la llave del .env
# Esto fallará a propósito si olvidas poner la llave, lo cual es una medida de seguridad.
cipher_suite = Fernet(os.environ['ENCRYPTION_MASTER_KEY'].encode())

def encrypt_file_data(file_content: bytes) -> bytes:
    """
    Toma los bytes crudos del archivo (ej. el PDF) y los encripta.
    """
    return cipher_suite.encrypt(file_content)

def decrypt_file_data(encrypted_content: bytes) -> bytes:
    """
    Toma la sopa de letras del disco y la devuelve a formato PDF legible.
    """
    return cipher_suite.decrypt(encrypted_content)