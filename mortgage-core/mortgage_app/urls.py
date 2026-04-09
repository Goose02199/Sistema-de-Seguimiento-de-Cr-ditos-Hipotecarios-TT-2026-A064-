from django.urls import path
from .views import RiskAssessmentView, BankRecommendationView, LoanApplicationCreateView

urlpatterns = [
    path('analyze-risk/', RiskAssessmentView.as_view(), name='analyze_risk'),
    path('recommend-banks/', BankRecommendationView.as_view(), name='recommend_banks'),
    path('applications/', LoanApplicationCreateView.as_view(), name='loan-application-create'),
]