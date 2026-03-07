from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models

class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('El email es obligatorio')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password) # RF5: Hashing de contraseña automático
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'ADMINISTRADOR')
        return self.create_user(email, password, **extra_fields)

class User(AbstractUser):
    # Definición de Roles (RF250, RF915)
    class Role(models.TextChoices):
        ADMINISTRADOR = 'ADMINISTRADOR', 'Administrador'
        BROKER = 'BROKER', 'Bróker'
        CLIENTE = 'CLIENTE', 'Cliente'

    # Campos base de Django que no usaremos o modificaremos
    username = None
    email = models.EmailField('Correo electrónico', unique=True) # RF4

    # Campos compartidos del reporte técnico (Tablas 27, 34, 35)
    full_name = models.CharField('Nombre completo', max_length=150) 
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.CLIENTE)
    phone = models.CharField('Teléfono', max_length=20, blank=True, null=True) 
    status = models.CharField('Estatus', max_length=50, default='Activo') 
    registration_date = models.DateField(auto_now_add=True) 

    # Campos específicos para el Solicitante/Cliente (Tabla 27)
    birth_date = models.DateField('Fecha de nacimiento', null=True, blank=True) 
    marital_status = models.CharField('Estado civil', max_length=45, blank=True) 
    curp_rfc = models.CharField('CURP/RFC', max_length=45, blank=True) 
    address = models.CharField('Domicilio', max_length=255, blank=True) 
    postal_code = models.CharField('Código Postal', max_length=10, blank=True) 
    state = models.CharField('Estado', max_length=50, blank=True) 
    municipality = models.CharField('Municipio', max_length=50, blank=True) 
    housing_status = models.CharField('Situación vivienda', max_length=50, blank=True) 
    person_type = models.CharField('Tipo persona', max_length=10, blank=True) 

    # Campos específicos para el Bróker (Tabla 34)
    admin_creator = models.CharField('Admin alta', max_length=50, blank=True, null=True) 
    location = models.CharField('Ubicación', max_length=50, blank=True, null=True)
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['full_name']

    objects = UserManager()

    def __str__(self):
        return f"{self.email} ({self.role})"