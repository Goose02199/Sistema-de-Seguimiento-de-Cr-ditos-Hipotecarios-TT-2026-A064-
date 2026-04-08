from django.urls import path
from .views import RiskAssessmentView, BankRecommendationView

urlpatterns = [
    path('analyze-risk/', RiskAssessmentView.as_view(), name='analyze_risk'),
    path('recommend-banks/', BankRecommendationView.as_view(), name='recommend_banks'),
    path('analyze-risk/', RiskAssessmentView.as_view(), name='analyze_risk'),
]