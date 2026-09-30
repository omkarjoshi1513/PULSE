import uuid
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from backend.app.models.models import Project, Intervention, SimulationRun

class SimulationEngine:
    def simulate(self, db: Session, project_id: str, intervention_ids: List[str]) -> Dict[str, Any]:
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise ValueError(f"Project with ID {project_id} not found.")

        # Baseline: DO NOTHING
        baseline_risk = project.current_risk_score
        baseline_delay = project.expected_delay_months
        baseline_cost = project.expected_cost_overrun_cr

        baseline_item = {
            "scenario_name": "DO NOTHING (Baseline)",
            "intervention_names": ["No Action Taken"],
            "risk_score": baseline_risk,
            "risk_reduction_points": 0,
            "expected_delay_months": baseline_delay,
            "time_saved_months": 0.0,
            "expected_cost_impact_cr": baseline_cost,
            "potential_cost_avoided_cr": 0.0,
            "total_cost_cr": 0.0,
            "total_manpower": 0,
            "is_baseline": True
        }

        # If no interventions selected, return baseline comparison
        if not intervention_ids:
            return {
                "project_id": project_id,
                "baseline": baseline_item,
                "simulated": baseline_item,
                "risk_reduction_points": 0,
                "time_saved_months": 0.0,
                "cost_avoided_cr": 0.0,
                "total_intervention_cost_cr": 0.0,
                "total_manpower_required": 0,
                "comparisons": [baseline_item],
                "assumptions_note": "Baseline scenario reflects projected trajectory under current operational conditions."
            }

        # Retrieve selected interventions
        interventions = db.query(Intervention).filter(Intervention.id.in_(intervention_ids)).all()
        
        # Calculate combined effects with diminishing marginal returns (sub-additive portfolio effect)
        raw_risk_red = 0.0
        raw_time_saved = 0.0
        raw_cost_avoided = 0.0
        total_cost = 0.0
        total_manpower = 0
        names = []

        # Sort interventions by effectiveness
        sorted_ints = sorted(interventions, key=lambda x: x.max_risk_reduction, reverse=True)
        for idx, item in enumerate(sorted_ints):
            names.append(item.name)
            total_cost += item.estimated_cost_cr
            total_manpower += item.required_manpower
            
            # Diminishing returns factor for overlapping synergy: 1.0 for first, 0.82 for second, 0.70 for third+
            damping = 1.0 if idx == 0 else (0.82 if idx == 1 else 0.70)
            raw_risk_red += item.max_risk_reduction * damping
            raw_time_saved += item.expected_time_saved_months * damping
            raw_cost_avoided += item.expected_cost_avoided_cr * damping

        # Bound simulation results to realistic ranges
        sim_risk = max(18, int(round(baseline_risk - raw_risk_red)))
        actual_risk_red = baseline_risk - sim_risk
        
        sim_delay = max(0.5, round(baseline_delay - raw_time_saved, 1))
        actual_time_saved = round(baseline_delay - sim_delay, 1)

        sim_cost_impact = max(5.0, round(baseline_cost - raw_cost_avoided, 1))
        actual_cost_avoided = round(baseline_cost - sim_cost_impact, 1)

        simulated_item = {
            "scenario_name": "Combined Intervention Package" if len(interventions) > 1 else interventions[0].name,
            "intervention_names": names,
            "risk_score": sim_risk,
            "risk_reduction_points": actual_risk_red,
            "expected_delay_months": sim_delay,
            "time_saved_months": actual_time_saved,
            "expected_cost_impact_cr": sim_cost_impact,
            "potential_cost_avoided_cr": actual_cost_avoided,
            "total_cost_cr": round(total_cost, 1),
            "total_manpower": total_manpower,
            "is_baseline": False
        }

        # Build comparison scenarios (Individual interventions vs Combined)
        comparisons = [baseline_item]
        for item in interventions:
            ind_risk = max(18, int(round(baseline_risk - item.max_risk_reduction)))
            ind_delay = max(0.5, round(baseline_delay - item.expected_time_saved_months, 1))
            ind_cost = max(5.0, round(baseline_cost - item.expected_cost_avoided_cr, 1))
            comparisons.append({
                "scenario_name": f"Option: {item.name}",
                "intervention_names": [item.name],
                "risk_score": ind_risk,
                "risk_reduction_points": baseline_risk - ind_risk,
                "expected_delay_months": ind_delay,
                "time_saved_months": round(baseline_delay - ind_delay, 1),
                "expected_cost_impact_cr": ind_cost,
                "potential_cost_avoided_cr": round(baseline_cost - ind_cost, 1),
                "total_cost_cr": item.estimated_cost_cr,
                "total_manpower": item.required_manpower,
                "is_baseline": False
            })

        if len(interventions) > 1:
            comparisons.append(simulated_item)

        # Log simulation run to database for auditability
        run_record = SimulationRun(
            id=f"SIM-{uuid.uuid4().hex[:8].upper()}",
            project_id=project_id,
            baseline_risk=baseline_risk,
            baseline_delay_months=baseline_delay,
            baseline_cost_impact_cr=baseline_cost,
            selected_intervention_ids=intervention_ids,
            simulated_risk=sim_risk,
            simulated_delay_months=sim_delay,
            simulated_cost_impact_cr=sim_cost_impact,
            risk_reduction_points=actual_risk_red,
            time_saved_months=actual_time_saved,
            potential_cost_avoided_cr=actual_cost_avoided,
            total_intervention_cost_cr=round(total_cost, 1),
            total_manpower_required=total_manpower,
            is_feasible=True,
            assumptions_note="Projected impact under modeled XGBoost & SHAP assumptions. Simulation is a decision-support projection and not causal proof."
        )
        db.add(run_record)
        db.commit()

        return {
            "project_id": project_id,
            "baseline": baseline_item,
            "simulated": simulated_item,
            "risk_reduction_points": actual_risk_red,
            "time_saved_months": actual_time_saved,
            "cost_avoided_cr": actual_cost_avoided,
            "total_intervention_cost_cr": round(total_cost, 1),
            "total_manpower_required": total_manpower,
            "comparisons": comparisons,
            "assumptions_note": "Projected impact under modeled assumptions. Simulation is a decision-support projection and not causal proof."
        }

simulation_engine = SimulationEngine()
