from django.urls import path
from .views import RiskAssessmentView, BankRecommendationView, LoanApplicationCreateView, LoanApplicationListView, LoanApplicationDetailView

urlpatterns = [
    path('analyze-risk/', RiskAssessmentView.as_view(), name='analyze_risk'),
    path('recommend-banks/', BankRecommendationView.as_view(), name='recommend_banks'),
    path('applications/', LoanApplicationCreateView.as_view(), name='loan-application-create'),
    path('portfolio/', LoanApplicationListView.as_view(), name='admin-portfolio'),
    path('applications/<int:pk>/', LoanApplicationDetailView.as_view(), name='loan-application-detail'),
]