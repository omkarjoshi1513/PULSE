from datetime import datetime
from typing import Dict, Any
from sqlalchemy.orm import Session
from backend.app.models.models import Project, RiskDriver, Action, Intervention
from backend.app.services.project_service import project_service
from backend.app.schemas.schemas import ReviewBriefResponse, RiskDriverSchema

class ReportGenerator:
    def generate_review_brief(self, db: Session, project_id: str, officer_name: str = "Dr. Vikram Sharma, MoSPI") -> ReviewBriefResponse:
        detail = project_service.get_project_detail(db, project_id)
        actions = db.query(Action).filter(Action.project_id == project_id).all()
        
        project_overview = {
            "project_id": detail.id,
            "project_name": detail.name,
            "ministry": detail.ministry_name,
            "sector": detail.sector_name,
            "state": detail.state_name,
            "original_cost_cr": detail.original_cost,
            "revised_cost_cr": detail.revised_cost,
            "cumulative_expenditure_cr": detail.cumulative_expenditure,
            "start_date": detail.start_date,
            "target_completion": detail.anticipated_completion_date,
            "physical_progress_pct": detail.physical_progress_pct,
            "planned_progress_pct": detail.planned_progress_pct,
            "progress_lag_pct": detail.progress_lag_pct
        }

        current_risk = {
            "composite_score": detail.current_risk_score,
            "category": detail.risk_category,
            "movement": f"{detail.risk_trajectory[0]} → {detail.risk_trajectory[-2]} → {detail.risk_trajectory[-1]}",
            "risk_change": f"{detail.risk_change:+d} points",
            "early_warning_active": detail.early_warning_flag,
            "primary_driver": detail.primary_driver
        }

        cost_forecast = {
            "cost_overrun_probability_pct": int(detail.cost_risk_prob * 100),
            "expected_additional_cost_cr": detail.expected_cost_overrun_cr,
            "confidence_level": f"{int(detail.prediction_confidence * 100)}%",
            "model_reference": detail.model_name
        }

        time_forecast = {
            "time_overrun_probability_pct": int(detail.time_risk_prob * 100),
            "expected_delay_months": detail.expected_delay_months,
            "confidence_interval": f"{detail.confidence_interval_low} - {detail.confidence_interval_high} months",
            "model_reference": detail.model_name
        }

        # Interventions
        recommended_interventions = [
            {
                "intervention": "Accelerate Land Acquisition (INT_001)",
                "category": "Administrative",
                "estimated_cost_cr": 35.0,
                "expected_risk_reduction": 18,
                "time_saved_months": 3.1
            },
            {
                "intervention": "Increase Fund Release & Working Capital (INT_002)",
                "category": "Financial",
                "estimated_cost_cr": 35.0,
                "expected_risk_reduction": 15,
                "time_saved_months": 2.3
            }
        ]

        simulated_impact = {
            "package_name": "Combined RoW & Liquidity Acceleration",
            "simulated_risk_score": 52,
            "risk_reduction_points": 30,
            "simulated_delay_months": 3.9,
            "time_saved_months": 4.3,
            "simulated_additional_cost_cr": 59.0,
            "potential_cost_avoided_cr": 67.0,
            "total_intervention_cost_cr": 70.0
        }

        approved_actions_list = []
        for a in actions:
            approved_actions_list.append({
                "action_id": a.id,
                "intervention": a.intervention_name,
                "status": a.status,
                "assigned_officer": a.assigned_officer,
                "deadline": a.deadline,
                "cost_cr": a.estimated_cost_cr
            })

        signoff_text = (
            f"Prepared under the authority of MoSPI Data Informatics & Innovation Division (DIID). "
            f"All probabilistic forecasts and simulated intervention impacts are generated for decision support. "
            f"Statutory authority and final expenditure approval rest exclusively with the designated Monitoring Officer."
        )

        return ReviewBriefResponse(
            generated_at=datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC"),
            officer_name=officer_name,
            project_overview=project_overview,
            current_risk=current_risk,
            what_changed=detail.what_changed,
            risk_drivers=detail.drivers,
            cost_forecast=cost_forecast,
            time_forecast=time_forecast,
            recommended_interventions=recommended_interventions,
            simulated_impact=simulated_impact,
            approved_actions=approved_actions_list,
            current_status=detail.status,
            governance_signoff_text=signoff_text
        )

report_generator = ReportGenerator()
