from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.app.models.models import (
    Project, ProjectMonthlyUpdate, RiskDriver, Intervention, Action, Bottleneck
)
from backend.app.schemas.schemas import (
    PortfolioKPISchema, HeatmapCell, WhatChangedItem, WhatChangedDetail,
    ProjectSummary, ProjectDetail, BenchmarkData, RiskDriverSchema, MonthlyUpdateSchema
)

class ProjectService:
    def get_portfolio_kpis(self, db: Session) -> PortfolioKPISchema:
        total = db.query(Project).count()
        high_risk = db.query(Project).filter(Project.current_risk_score >= 70).count()
        monitor = db.query(Project).filter(Project.current_risk_score >= 40, Project.current_risk_score < 70).count()
        stable = db.query(Project).filter(Project.current_risk_score < 40).count()
        
        cost_at_risk = db.query(func.sum(Project.expected_cost_overrun_cr)).filter(Project.current_risk_score >= 70).scalar() or 0.0
        tot_cost = db.query(func.sum(Project.revised_cost)).scalar() or 0.0
        avg_delay = db.query(func.avg(Project.expected_delay_months)).scalar() or 0.0
        requiring_action = db.query(Project).filter(Project.status.in_(["Critical", "Under Review"])).count()
        early_warns = db.query(Project).filter(Project.early_warning_flag == True).count()

        return PortfolioKPISchema(
            total_projects=total,
            high_risk_projects=high_risk,
            monitor_projects=monitor,
            stable_projects=stable,
            cost_at_risk_cr=round(float(cost_at_risk), 1),
            total_portfolio_cost_cr=round(float(tot_cost), 1),
            average_delay_months=round(float(avg_delay), 1),
            projects_requiring_action=requiring_action,
            early_warnings_active=early_warns,
            reporting_period="September 2026 (Q2 Cycle)"
        )

    def get_heatmap_data(
        self,
        db: Session,
        ministry_filter: Optional[str] = None,
        sector_filter: Optional[str] = None,
        state_filter: Optional[str] = None
    ) -> List[HeatmapCell]:
        query = db.query(
            Project.sector_name,
            Project.state_name,
            func.count(Project.id).label("project_count"),
            func.avg(Project.current_risk_score).label("avg_risk"),
            func.sum(Project.revised_cost).label("total_cost")
        )
        if ministry_filter and ministry_filter != "All":
            query = query.filter(Project.ministry_name == ministry_filter)
        if sector_filter and sector_filter != "All":
            query = query.filter(Project.sector_name == sector_filter)
        if state_filter and state_filter != "All":
            query = query.filter(Project.state_name == state_filter)

        results = query.group_by(Project.sector_name, Project.state_name).all()

        cells = []
        for r in results:
            # count high risk in this cell
            hr_count = db.query(Project).filter(
                Project.sector_name == r.sector_name,
                Project.state_name == r.state_name,
                Project.current_risk_score >= 70
            ).count()

            cells.append(HeatmapCell(
                sector=r.sector_name,
                state=r.state_name,
                project_count=r.project_count,
                avg_risk_score=round(float(r.avg_risk), 1),
                high_risk_count=hr_count,
                total_cost_cr=round(float(r.total_cost or 0.0), 1)
            ))
        return cells

    def get_what_changed_summary(self, db: Session) -> List[WhatChangedItem]:
        # Significant changes this month
        rising_risk = db.query(Project).filter(Project.risk_change >= 8).count()
        land_delays = db.query(Project).filter(Project.primary_driver == "Land Acquisition Delay").count()
        crossed_threshold = db.query(Project).filter(Project.early_warning_flag == True).count()
        clearance_issues = db.query(Project).filter(Project.primary_driver == "Pending Statutory Clearance").count()

        return [
            WhatChangedItem(
                category="Risk Escalation",
                metric="Sudden Risk Surge",
                headline=f"{rising_risk} projects experienced significant risk increases (≥ 8 points).",
                count_affected=rising_risk,
                severity="critical"
            ),
            WhatChangedItem(
                category="Right-of-Way",
                metric="Land Acquisition Backlog",
                headline=f"Land acquisition delays intensified across {land_delays} strategic projects.",
                count_affected=land_delays,
                severity="high"
            ),
            WhatChangedItem(
                category="Early Warning",
                metric="Threshold Breached",
                headline=f"{crossed_threshold} projects crossed the automated early-warning intervention threshold.",
                count_affected=crossed_threshold,
                severity="critical"
            ),
            WhatChangedItem(
                category="Statutory Approvals",
                metric="Clearance Bottlenecks",
                headline=f"Inter-ministerial statutory clearances delayed in {clearance_issues} capital projects.",
                count_affected=clearance_issues,
                severity="moderate"
            )
        ]

    def get_projects(
        self,
        db: Session,
        search: Optional[str] = None,
        ministry: Optional[str] = None,
        sector: Optional[str] = None,
        state: Optional[str] = None,
        risk_category: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[ProjectSummary]:
        q = db.query(Project)
        if search:
            search_str = f"%{search}%"
            q = q.filter(
                (Project.id.ilike(search_str)) |
                (Project.name.ilike(search_str)) |
                (Project.primary_driver.ilike(search_str))
            )
        if ministry and ministry != "All":
            q = q.filter(Project.ministry_name == ministry)
        if sector and sector != "All":
            q = q.filter(Project.sector_name == sector)
        if state and state != "All":
            q = q.filter(Project.state_name == state)
        if risk_category and risk_category != "All":
            q = q.filter(Project.risk_category == risk_category)
        if status and status != "All":
            q = q.filter(Project.status == status)

        # Sort with hero project P10291 first, then by risk score descending
        q = q.order_by(
            (Project.id == "P10291").desc(),
            Project.current_risk_score.desc()
        )
        projects = q.offset(offset).limit(limit).all()
        return [ProjectSummary.model_validate(p) for p in projects]

    def get_project_detail(self, db: Session, project_id: str) -> ProjectDetail:
        p = db.query(Project).filter(Project.id == project_id).first()
        if not p:
            raise ValueError(f"Project {project_id} not found.")

        # Trajectory (e.g. 54 -> 79 -> 82)
        if p.id == "P10291":
            trajectory = [54, 62, 71, 79, 82]
            what_changed = [
                WhatChangedDetail(
                    feature_name="Progress Lag",
                    current_val="17.0%",
                    previous_val="5.0%",
                    delta_display="+12.0%",
                    severity="Critical",
                    direction="worsened"
                ),
                WhatChangedDetail(
                    feature_name="Clearance Delay",
                    current_val="3.0 months",
                    previous_val="1.0 month",
                    delta_display="+2.0 months",
                    severity="High",
                    direction="worsened"
                ),
                WhatChangedDetail(
                    feature_name="Expenditure Burn Rate",
                    current_val="1.15x",
                    previous_val="1.07x",
                    delta_display="+8% burn",
                    severity="High",
                    direction="worsened"
                ),
                WhatChangedDetail(
                    feature_name="Land Acquisition Access",
                    current_val="85.0%",
                    previous_val="92.0%",
                    delta_display="-7.0% effective RoW",
                    severity="High",
                    direction="worsened"
                )
            ]
        else:
            trajectory = [
                max(10, p.previous_risk_score - int(p.risk_change * 0.6)),
                p.previous_risk_score,
                p.current_risk_score
            ]
            what_changed = [
                WhatChangedDetail(
                    feature_name="Progress Lag",
                    current_val=f"{p.progress_lag_pct:.1f}%",
                    previous_val=f"{max(0.0, p.progress_lag_pct - 3.5):.1f}%",
                    delta_display=f"{'+' if p.risk_change > 0 else '-'}{abs(p.risk_change * 0.3):.1f}%",
                    severity="High" if p.current_risk_score >= 70 else "Moderate",
                    direction="worsened" if p.risk_change > 0 else "improved"
                ),
                WhatChangedDetail(
                    feature_name="Statutory Clearance",
                    current_val=f"{p.expected_delay_months * 0.35:.1f} mo",
                    previous_val=f"{max(0.0, p.expected_delay_months * 0.25):.1f} mo",
                    delta_display="+0.5 mo",
                    severity="Moderate",
                    direction="worsened" if p.risk_change > 0 else "unchanged"
                )
            ]

        # Peer benchmarking: similar size and sector
        avg_peer_risk = db.query(func.avg(Project.current_risk_score)).filter(
            Project.sector_name == p.sector_name
        ).scalar() or 61.0

        avg_peer_delay = db.query(func.avg(Project.expected_delay_months)).filter(
            Project.sector_name == p.sector_name
        ).scalar() or 4.5

        peer_count = db.query(Project).filter(Project.sector_name == p.sector_name).count()

        benchmark = BenchmarkData(
            peer_group_name=f"Projects in {p.sector_name} sector",
            peer_count=peer_count,
            avg_peer_risk=round(float(avg_peer_risk), 1),
            this_project_risk=float(p.current_risk_score),
            avg_peer_delay_months=round(float(avg_peer_delay), 1),
            this_project_delay_months=float(p.expected_delay_months),
            risk_percentile=round(float(min(99.0, max(5.0, (p.current_risk_score / 100.0) * 100.0))), 1)
        )

        drivers = db.query(RiskDriver).filter(RiskDriver.project_id == project_id).all()
        history = db.query(ProjectMonthlyUpdate).filter(
            ProjectMonthlyUpdate.project_id == project_id
        ).order_by(ProjectMonthlyUpdate.month_year.asc()).all()

        return ProjectDetail(
            id=p.id,
            name=p.name,
            ministry_name=p.ministry_name,
            sector_name=p.sector_name,
            state_name=p.state_name,
            original_cost=p.original_cost,
            revised_cost=p.revised_cost,
            cumulative_expenditure=p.cumulative_expenditure,
            start_date=p.start_date,
            original_completion_date=p.original_completion_date,
            anticipated_completion_date=p.anticipated_completion_date,
            physical_progress_pct=p.physical_progress_pct,
            planned_progress_pct=p.planned_progress_pct,
            progress_lag_pct=p.progress_lag_pct,
            financial_progress_pct=p.financial_progress_pct,
            current_risk_score=p.current_risk_score,
            previous_risk_score=p.previous_risk_score,
            risk_trajectory=trajectory,
            risk_category=p.risk_category,
            risk_change=p.risk_change,
            cost_risk_prob=p.cost_risk_prob,
            time_risk_prob=p.time_risk_prob,
            expected_cost_overrun_cr=p.expected_cost_overrun_cr,
            expected_delay_months=p.expected_delay_months,
            prediction_confidence=p.prediction_confidence,
            confidence_interval_low=p.confidence_interval_low,
            confidence_interval_high=p.confidence_interval_high,
            model_name=p.model_name,
            status=p.status,
            early_warning_flag=p.early_warning_flag,
            early_warning_trigger=p.early_warning_trigger,
            primary_driver=p.primary_driver,
            what_changed=what_changed,
            drivers=[RiskDriverSchema.model_validate(d) for d in drivers],
            history=[MonthlyUpdateSchema.model_validate(h) for h in history],
            benchmark=benchmark
        )

project_service = ProjectService()
