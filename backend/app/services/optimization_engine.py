from typing import List, Dict, Any, Optional
from itertools import combinations
from sqlalchemy.orm import Session
from backend.app.models.models import Project, Intervention
from backend.app.schemas.schemas import InterventionSchema

try:
    from ortools.linear_solver import pywraplp
    HAS_ORTOOLS = True
except ImportError:
    HAS_ORTOOLS = False

class OptimizationEngine:
    def optimize(
        self,
        db: Session,
        project_id: str,
        available_budget_cr: float,
        available_manpower: int,
        priority_level: str = "High",
        max_cost_per_intervention_cr: Optional[float] = None
    ) -> Dict[str, Any]:
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise ValueError(f"Project {project_id} not found.")

        interventions = db.query(Intervention).all()
        candidate_items = []
        for item in interventions:
            if max_cost_per_intervention_cr and item.estimated_cost_cr > max_cost_per_intervention_cr:
                continue
            candidate_items.append(item)

        # Multi-criteria scoring:
        # If priority_level == "Cost", prioritize cost avoidance per cr spent
        # If priority_level == "Time", prioritize time saved
        # Default "High" balances risk reduction and schedule recovery
        best_combo = []
        best_score = -1.0
        all_feasible_combos = []

        # Exact multi-combination evaluation (up to 4 simultaneous interventions)
        for k in range(1, min(5, len(candidate_items) + 1)):
            for combo in combinations(candidate_items, k):
                tot_cost = sum(c.estimated_cost_cr for c in combo)
                tot_manpower = sum(c.required_manpower for c in combo)

                if tot_cost <= available_budget_cr and tot_manpower <= available_manpower:
                    # Calculate diminishing returns
                    sorted_c = sorted(combo, key=lambda x: x.max_risk_reduction, reverse=True)
                    raw_risk_red = 0.0
                    raw_time_saved = 0.0
                    raw_cost_avoided = 0.0
                    for idx, c in enumerate(sorted_c):
                        damp = 1.0 if idx == 0 else (0.82 if idx == 1 else 0.70)
                        raw_risk_red += c.max_risk_reduction * damp
                        raw_time_saved += c.expected_time_saved_months * damp
                        raw_cost_avoided += c.expected_cost_avoided_cr * damp

                    # Score function
                    if priority_level == "Time":
                        score = (raw_time_saved * 15.0) + (raw_risk_red * 1.0)
                    elif priority_level == "Cost":
                        score = (raw_cost_avoided * 1.2) + (raw_risk_red * 0.8)
                    else:
                        score = (raw_risk_red * 2.0) + (raw_time_saved * 5.0)

                    combo_record = {
                        "combo": list(combo),
                        "total_cost": round(tot_cost, 1),
                        "total_manpower": tot_manpower,
                        "risk_red": raw_risk_red,
                        "time_saved": round(raw_time_saved, 1),
                        "cost_avoided": round(raw_cost_avoided, 1),
                        "score": score
                    }
                    all_feasible_combos.append(combo_record)
                    if score > best_score:
                        best_score = score
                        best_combo = combo_record

        # If no combination fits the budget/manpower
        if not best_combo:
            return {
                "project_id": project_id,
                "recommended_interventions": [],
                "total_cost_cr": 0.0,
                "total_manpower": 0,
                "expected_risk_score": project.current_risk_score,
                "expected_delay_months": project.expected_delay_months,
                "expected_cost_impact_cr": project.expected_cost_overrun_cr,
                "risk_reduction_points": 0,
                "time_saved_months": 0.0,
                "cost_avoided_cr": 0.0,
                "remaining_budget_cr": available_budget_cr,
                "remaining_manpower": available_manpower,
                "explanation": "No intervention combination is feasible within the given budget and manpower constraints. Consider expanding resource envelopes.",
                "alternatives": []
            }

        rec_items = best_combo["combo"]
        tot_cost = best_combo["total_cost"]
        tot_manpower = best_combo["total_manpower"]
        risk_red = int(round(best_combo["risk_red"]))
        time_saved = best_combo["time_saved"]
        cost_avoided = best_combo["cost_avoided"]

        sim_risk = max(18, project.current_risk_score - risk_red)
        sim_delay = max(0.5, round(project.expected_delay_months - time_saved, 1))
        sim_cost_impact = max(5.0, round(project.expected_cost_overrun_cr - cost_avoided, 1))

        # Build clean alternatives (e.g. 2nd and 3rd best distinct feasible packages)
        all_feasible_combos.sort(key=lambda x: x["score"], reverse=True)
        alternatives = []
        seen_names = {tuple(sorted(c.name for c in rec_items))}
        for fc in all_feasible_combos[1:]:
            c_names = tuple(sorted(c.name for c in fc["combo"]))
            if c_names not in seen_names:
                seen_names.add(c_names)
                alternatives.append({
                    "names": [c.name for c in fc["combo"]],
                    "total_cost_cr": fc["total_cost"],
                    "total_manpower": fc["total_manpower"],
                    "expected_risk": max(18, project.current_risk_score - int(round(fc["risk_red"]))),
                    "time_saved_months": fc["time_saved"],
                    "cost_avoided_cr": fc["cost_avoided"]
                })
                if len(alternatives) >= 2:
                    break

        item_names_str = " + ".join([item.name for item in rec_items])
        explanation = (
            f"Recommended combination: '{item_names_str}'. "
            f"This package delivers the highest modeled risk reduction (-{risk_red} points) "
            f"and expected schedule recovery ({time_saved} months saved) while strictly respecting the "
            f"₹{available_budget_cr:.1f} Cr budget (utilizing ₹{tot_cost:.1f} Cr) and {available_manpower} officer/inspector "
            f"allocation limit (utilizing {tot_manpower}). Recommended for human officer review."
        )

        schema_items = [InterventionSchema.model_validate(item) for item in rec_items]

        return {
            "project_id": project_id,
            "recommended_interventions": schema_items,
            "total_cost_cr": tot_cost,
            "total_manpower": tot_manpower,
            "expected_risk_score": sim_risk,
            "expected_delay_months": sim_delay,
            "expected_cost_impact_cr": sim_cost_impact,
            "risk_reduction_points": risk_red,
            "time_saved_months": time_saved,
            "cost_avoided_cr": cost_avoided,
            "remaining_budget_cr": round(available_budget_cr - tot_cost, 1),
            "remaining_manpower": available_manpower - tot_manpower,
            "explanation": explanation,
            "alternatives": alternatives
        }

optimization_engine = OptimizationEngine()
