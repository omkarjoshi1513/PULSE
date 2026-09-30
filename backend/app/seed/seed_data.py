import random
import json
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from backend.app.core.database import SessionLocal, engine, Base
from backend.app.models.models import (
    User, Ministry, Sector, State, Project, ProjectMonthlyUpdate,
    RiskDriver, Intervention, Action, ActionUpdate, Bottleneck, AuditLog
)

MINISTRIES_DATA = [
    {"code": "MoRTH", "name": "Ministry of Road Transport and Highways"},
    {"code": "MOR", "name": "Ministry of Railways"},
    {"code": "MOP", "name": "Ministry of Power"},
    {"code": "MoPNG", "name": "Ministry of Petroleum and Natural Gas"},
    {"code": "MoHUA", "name": "Ministry of Housing and Urban Affairs"},
    {"code": "MoPSW", "name": "Ministry of Ports, Shipping and Waterways"},
    {"code": "MOC", "name": "Ministry of Coal"},
    {"code": "MNRE", "name": "Ministry of New and Renewable Energy"},
    {"code": "MoST", "name": "Ministry of Steel"},
    {"code": "MoC&I", "name": "Ministry of Commerce and Industry"},
    {"code": "DoT", "name": "Department of Telecommunications"},
    {"code": "DoA", "name": "Department of Atomic Energy"},
    {"code": "MoCA", "name": "Ministry of Civil Aviation"},
    {"code": "MoJS", "name": "Ministry of Jal Shakti"},
    {"code": "MoEFCC", "name": "Ministry of Environment, Forest and Climate Change"},
    {"code": "MoM", "name": "Ministry of Mines"},
    {"code": "MoHFW", "name": "Ministry of Health and Family Welfare"},
]

SECTORS_DATA = [
    {"name": "Roads & Highways", "category": "Transport", "icon": "Truck"},
    {"name": "Railways", "category": "Transport", "icon": "Train"},
    {"name": "Power & Renewable Energy", "category": "Energy", "icon": "Zap"},
    {"name": "Petroleum & Natural Gas", "category": "Energy", "icon": "Flame"},
    {"name": "Urban Transport / Metro", "category": "Urban Infrastructure", "icon": "Building"},
    {"name": "Ports & Shipping", "category": "Logistics", "icon": "Anchor"},
    {"name": "Coal & Mining", "category": "Resources", "icon": "Pickaxe"},
    {"name": "Water Resources & Sanitation", "category": "Utilities", "icon": "Droplet"},
    {"name": "Civil Aviation & Airports", "category": "Transport", "icon": "Plane"},
    {"name": "Telecommunications & Digital", "category": "Digital", "icon": "Radio"},
    {"name": "Heavy Industry & Steel", "category": "Manufacturing", "icon": "Factory"},
    {"name": "Atomic & Nuclear Power", "category": "Energy", "icon": "Atom"},
]

STATES_DATA = [
    {"code": "MH", "name": "Maharashtra", "region": "Western"},
    {"code": "UP", "name": "Uttar Pradesh", "region": "Northern"},
    {"code": "KA", "name": "Karnataka", "region": "Southern"},
    {"code": "GJ", "name": "Gujarat", "region": "Western"},
    {"code": "TN", "name": "Tamil Nadu", "region": "Southern"},
    {"code": "MP", "name": "Madhya Pradesh", "region": "Central"},
    {"code": "OD", "name": "Odisha", "region": "Eastern"},
    {"code": "AP", "name": "Andhra Pradesh", "region": "Southern"},
    {"code": "WB", "name": "West Bengal", "region": "Eastern"},
    {"code": "RJ", "name": "Rajasthan", "region": "Northern"},
    {"code": "BR", "name": "Bihar", "region": "Eastern"},
    {"code": "JH", "name": "Jharkhand", "region": "Eastern"},
    {"code": "TG", "name": "Telangana", "region": "Southern"},
    {"code": "KL", "name": "Kerala", "region": "Southern"},
    {"code": "PB", "name": "Punjab", "region": "Northern"},
    {"code": "HR", "name": "Haryana", "region": "Northern"},
    {"code": "AS", "name": "Assam", "region": "North Eastern"},
    {"code": "UK", "name": "Uttarakhand", "region": "Northern"},
    {"code": "HP", "name": "Himachal Pradesh", "region": "Northern"},
    {"code": "JK", "name": "Jammu & Kashmir", "region": "Northern"},
    {"code": "CG", "name": "Chhattisgarh", "region": "Central"},
]

INTERVENTIONS_DATA = [
    {
        "id": "INT_001",
        "code": "ACCEL_LAND_ACQ",
        "name": "Accelerate Land Acquisition",
        "category": "Administrative",
        "description": "Mobilize dedicated District Collector liaison cell with empowered compensation SLA for disputed and pending Right-of-Way parcels.",
        "applicable_conditions": "Land acquisition < 90% or right-of-way disputes causing > 2 months progress deviation.",
        "estimated_cost_cr": 35.0,
        "required_manpower": 18,
        "max_risk_reduction": 18.0,
        "expected_time_saved_months": 3.1,
        "expected_cost_avoided_cr": 35.0,
        "feature_changes_json": {"land_acquisition_delta": 15, "progress_lag_delta": -8, "clearance_delay_delta": -1.5}
    },
    {
        "id": "INT_002",
        "code": "INCR_FUND_REL",
        "name": "Increase Fund Release & Working Capital",
        "category": "Financial",
        "description": "Release fast-track mobilization advance and interim milestone tranches to alleviate contractor liquidity bottlenecks.",
        "applicable_conditions": "Financial burn rate ratio < 0.85 or contractor cash flow deficits reported in monthly audits.",
        "estimated_cost_cr": 35.0,
        "required_manpower": 12,
        "max_risk_reduction": 15.0,
        "expected_time_saved_months": 2.3,
        "expected_cost_avoided_cr": 32.0,
        "feature_changes_json": {"expenditure_burn_delta": 0.25, "contractor_efficiency_delta": 12}
    },
    {
        "id": "INT_003",
        "code": "PAR_CONTRACTOR",
        "name": "Parallel Contractor Deployment",
        "category": "Operational",
        "description": "Subdivide lagging civil work packages into parallel EPC sub-stretches with specialized secondary tier-1 contractors.",
        "applicable_conditions": "Progress lag > 12% across linear civil stretches where spatial parallelization is viable.",
        "estimated_cost_cr": 45.0,
        "required_manpower": 35,
        "max_risk_reduction": 20.0,
        "expected_time_saved_months": 3.5,
        "expected_cost_avoided_cr": 42.0,
        "feature_changes_json": {"progress_lag_delta": -12, "contractor_efficiency_delta": 15}
    },
    {
        "id": "INT_004",
        "code": "FAST_CLEARANCES",
        "name": "Fast-track Statutory Clearances",
        "category": "Administrative",
        "description": "Engage MoEFCC & State Forest Nodal Officer through National Project Monitoring Group (PMG) green corridor single-window review.",
        "applicable_conditions": "Pending environmental, forest Stage-II, or wildlife board approvals pending > 60 days.",
        "estimated_cost_cr": 15.0,
        "required_manpower": 10,
        "max_risk_reduction": 12.0,
        "expected_time_saved_months": 2.0,
        "expected_cost_avoided_cr": 25.0,
        "feature_changes_json": {"clearance_delay_delta": -2.0, "risk_change_delta": -10}
    },
    {
        "id": "INT_005",
        "code": "INCR_MANPOWER",
        "name": "Increase Manpower & Double Shift Deployment",
        "category": "Operational",
        "description": "Transition key critical path structural packages to 2-shift operations with dedicated safety and quality assurance squads.",
        "applicable_conditions": "Physical progress lag > 10% during non-monsoon construction windows.",
        "estimated_cost_cr": 25.0,
        "required_manpower": 40,
        "max_risk_reduction": 14.0,
        "expected_time_saved_months": 2.4,
        "expected_cost_avoided_cr": 28.0,
        "feature_changes_json": {"progress_lag_delta": -7, "contractor_efficiency_delta": 10}
    },
    {
        "id": "INT_006",
        "code": "EXPEDITE_PROCUREMENT",
        "name": "Expedite Procurement & Emergency Tendering",
        "category": "Procurement",
        "description": "Invoke accelerated procurement provisions under GFR guidelines for long-lead specialized equipment and electrical substations.",
        "applicable_conditions": "Procurement cycle delay exceeding 45 days on critical mechanical/electrical components.",
        "estimated_cost_cr": 18.0,
        "required_manpower": 8,
        "max_risk_reduction": 10.0,
        "expected_time_saved_months": 1.7,
        "expected_cost_avoided_cr": 20.0,
        "feature_changes_json": {"delay_months_delta": -1.5, "progress_lag_delta": -5}
    },
    {
        "id": "INT_007",
        "code": "RESEQ_ACTIVITIES",
        "name": "Re-sequence Critical Path Activities",
        "category": "Operational",
        "description": "Perform CPM (Critical Path Method) re-baselining: decouple bridge pier substructures from pending approaches, staging non-linear works.",
        "applicable_conditions": "Bottlenecks on one segment blocking subsequent segments while other rights-of-way remain accessible.",
        "estimated_cost_cr": 12.0,
        "required_manpower": 15,
        "max_risk_reduction": 11.0,
        "expected_time_saved_months": 1.9,
        "expected_cost_avoided_cr": 22.0,
        "feature_changes_json": {"progress_lag_delta": -6, "delay_months_delta": -1.8}
    },
    {
        "id": "INT_008",
        "code": "TECH_REVIEW",
        "name": "Additional Technical Review & Oversight",
        "category": "Contractual",
        "description": "Appoint IIT/NIT empanelled independent safety & structural oversight team to expedite design change orders.",
        "applicable_conditions": "Design revisions or geotechnical surprises slowing foundation approvals.",
        "estimated_cost_cr": 8.0,
        "required_manpower": 6,
        "max_risk_reduction": 7.0,
        "expected_time_saved_months": 1.2,
        "expected_cost_avoided_cr": 14.0,
        "feature_changes_json": {"clearance_delay_delta": -1.0, "contractor_efficiency_delta": 5}
    },
    {
        "id": "INT_009",
        "code": "CONTRACTOR_PERF",
        "name": "Contractor Performance Rebalancing & Penalty Escrow",
        "category": "Contractual",
        "description": "Issue contractual show-cause cure notice coupled with milestone incentive bonuses for early recovery of lost days.",
        "applicable_conditions": "Contractor efficiency index < 75% for two consecutive reporting cycles.",
        "estimated_cost_cr": 10.0,
        "required_manpower": 10,
        "max_risk_reduction": 9.0,
        "expected_time_saved_months": 1.5,
        "expected_cost_avoided_cr": 18.0,
        "feature_changes_json": {"contractor_efficiency_delta": 14, "progress_lag_delta": -4}
    },
    {
        "id": "INT_010",
        "code": "MAT_ALLOCATION",
        "name": "Priority Material Allocation Pass",
        "category": "Procurement",
        "description": "Authorize central infrastructure quota priority pass for bulk cement, high-tensile steel, and railway ballast supply.",
        "applicable_conditions": "Supply chain shortage of structural steel or cement causing site idle time.",
        "estimated_cost_cr": 22.0,
        "required_manpower": 14,
        "max_risk_reduction": 13.0,
        "expected_time_saved_months": 2.1,
        "expected_cost_avoided_cr": 26.0,
        "feature_changes_json": {"progress_lag_delta": -7, "expenditure_burn_delta": 0.15}
    },
    {
        "id": "INT_011",
        "code": "INTER_MINISTERIAL",
        "name": "Accelerated Inter-Ministerial Approval Workflow",
        "category": "Administrative",
        "description": "Convene bi-weekly Cabinet Secretariat / PMG empowered coordination meetings for defense, railways, and utility crossings.",
        "applicable_conditions": "Multiple ministries involved in clearances (e.g. railway overbridge, gas pipeline crossing, defence land).",
        "estimated_cost_cr": 10.0,
        "required_manpower": 8,
        "max_risk_reduction": 8.0,
        "expected_time_saved_months": 1.4,
        "expected_cost_avoided_cr": 16.0,
        "feature_changes_json": {"clearance_delay_delta": -1.5, "risk_change_delta": -8}
    },
    {
        "id": "INT_012",
        "code": "SCHED_RECOVERY",
        "name": "Schedule Recovery Sprint & Milestone Catch-Up",
        "category": "Operational",
        "description": "Execute 90-day intensive site recovery sprint with mobile batching plants, pre-cast modular members, and 24x7 telemetry.",
        "applicable_conditions": "Projects within 12 months of scheduled COD (Commercial Operation Date) facing milestone risk.",
        "estimated_cost_cr": 28.0,
        "required_manpower": 24,
        "max_risk_reduction": 16.0,
        "expected_time_saved_months": 2.8,
        "expected_cost_avoided_cr": 33.0,
        "feature_changes_json": {"progress_lag_delta": -10, "delay_months_delta": -2.5}
    }
]

BOTTLENECKS_DATA = [
    {
        "id": "BTN_001",
        "issue_name": "Land Acquisition & Right-of-Way Disputes",
        "category": "Administrative & Legal",
        "affected_projects_count": 23,
        "affected_sectors": ["Roads & Highways", "Railways", "Power & Renewable Energy"],
        "affected_states": ["Maharashtra", "Karnataka", "Madhya Pradesh", "Uttar Pradesh"],
        "sample_project_ids": ["P10291", "P10312", "P10355", "P10408", "P10492"],
        "average_delay_months": 4.7,
        "total_cost_at_risk_cr": 2840.0,
        "severity": "Critical",
        "trend": "Increased by 18% over last quarter",
        "systemic_recommendation": "Institute standardized district collector compensation SLA with direct DBT escrow and upfront social impact assessments."
    },
    {
        "id": "BTN_002",
        "issue_name": "Environmental & Forest Stage-II Clearances",
        "category": "Statutory & Clearances",
        "affected_projects_count": 19,
        "affected_sectors": ["Coal & Mining", "Roads & Highways", "Railways"],
        "affected_states": ["Odisha", "Jharkhand", "Chhattisgarh", "Madhya Pradesh"],
        "sample_project_ids": ["P10204", "P10288", "P10390", "P10444"],
        "average_delay_months": 5.2,
        "total_cost_at_risk_cr": 3410.0,
        "severity": "Critical",
        "trend": "Persistent backlog across 4 mining corridors",
        "systemic_recommendation": "Empower regional MoEFCC integrated regional offices to grant provisional Stage-I diversion clearances concurrently."
    },
    {
        "id": "BTN_003",
        "issue_name": "Inter-Agency Utility Shifting & Pipeline Relocation",
        "category": "Coordination",
        "affected_projects_count": 15,
        "affected_sectors": ["Urban Transport / Metro", "Roads & Highways", "Petroleum & Natural Gas"],
        "affected_states": ["Uttar Pradesh", "Maharashtra", "Tamil Nadu", "Gujarat"],
        "sample_project_ids": ["P10156", "P10291", "P10381", "P10502"],
        "average_delay_months": 3.8,
        "total_cost_at_risk_cr": 1650.0,
        "severity": "High",
        "trend": "Spike in urban expansion corridors",
        "systemic_recommendation": "Mandate unified GIS subsurface utility mapping before final DPR approval and contract award."
    },
    {
        "id": "BTN_004",
        "issue_name": "Liquidity & Milestone Fund Disbursement Delays",
        "category": "Financial",
        "affected_projects_count": 12,
        "affected_sectors": ["Railways", "Water Resources & Sanitation", "Urban Transport / Metro"],
        "affected_states": ["Bihar", "West Bengal", "Assam", "Odisha"],
        "sample_project_ids": ["P10188", "P10267", "P10329", "P10471"],
        "average_delay_months": 3.4,
        "total_cost_at_risk_cr": 1220.0,
        "severity": "Moderate",
        "trend": "Concentrated in state-shared funding packages",
        "systemic_recommendation": "Establish automated PFMS-linked milestone escrow releases triggered by validated drone survey verification."
    },
    {
        "id": "BTN_005",
        "issue_name": "Specialized Equipment & High-Capacity Machinery Shortages",
        "category": "Procurement & Logistics",
        "affected_projects_count": 14,
        "affected_sectors": ["Ports & Shipping", "Roads & Highways", "Civil Aviation & Airports"],
        "affected_states": ["Himachal Pradesh", "Uttarakhand", "Jammu & Kashmir", "Maharashtra"],
        "sample_project_ids": ["P10115", "P10242", "P10360", "P10419"],
        "average_delay_months": 4.1,
        "total_cost_at_risk_cr": 1980.0,
        "severity": "High",
        "trend": "Severe during pre-monsoon tunneling sprint",
        "systemic_recommendation": "Create national heavy tunnel-boring and launching-girder shared equipment pool under PM GatiShakti."
    }
]

def seed_database():
    print("Creating tables in database...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    db: Session = SessionLocal()
    try:
        print("Seeding Users...")
        users = [
            User(
                username="v_sharma",
                full_name="Dr. Vikram Sharma",
                email="vikram.sharma@mospi.gov.in",
                role="MONITORING_OFFICER",
                department="MoSPI - DIID Infrastructure Division"
            ),
            User(
                username="a_patel",
                full_name="Ananya Patel, IAS",
                email="ananya.patel@mospi.gov.in",
                role="ADMIN",
                department="Director General, DIID"
            ),
            User(
                username="r_kumar",
                full_name="Ramesh Kumar",
                email="ramesh.k@nic.in",
                role="VIEWER",
                department="Planning & Evaluation Cell"
            )
        ]
        db.add_all(users)
        db.commit()

        print("Seeding Ministries, Sectors, States...")
        for m in MINISTRIES_DATA:
            db.add(Ministry(code=m["code"], name=m["name"]))
        for s in SECTORS_DATA:
            db.add(Sector(name=s["name"], category=s["category"], icon=s["icon"]))
        for st in STATES_DATA:
            db.add(State(code=st["code"], name=st["name"], region=st["region"]))
        db.commit()

        print("Seeding Interventions Library (12 realistic government interventions)...")
        for i_data in INTERVENTIONS_DATA:
            db.add(Intervention(**i_data))
        db.commit()

        print("Seeding Systemic Bottlenecks...")
        for b_data in BOTTLENECKS_DATA:
            db.add(Bottleneck(**b_data))
        db.commit()

        # Seed Hero Project P10291 specifically
        print("Seeding Hero Project P10291...")
        hero_project = Project(
            id="P10291",
            name="National Highway Expansion - Western Corridor Phase II",
            ministry_name="Ministry of Road Transport and Highways",
            sector_name="Roads & Highways",
            state_name="Maharashtra",
            original_cost=1450.0,
            revised_cost=1780.0,
            cumulative_expenditure=1085.8,
            start_date="2023-04-01",
            original_completion_date="2026-03-31",
            anticipated_completion_date="2026-12-15",
            physical_progress_pct=48.0,
            planned_progress_pct=65.0,
            progress_lag_pct=17.0,
            financial_progress_pct=61.0,
            current_risk_score=82,
            previous_risk_score=79,
            risk_category="High Risk",
            risk_change=+25, # moved over last quarter from 54 -> 79 -> 82
            cost_risk_prob=0.74,
            time_risk_prob=0.81,
            expected_cost_overrun_cr=126.0,
            expected_delay_months=8.2,
            prediction_confidence=0.89,
            confidence_interval_low=6.5,
            confidence_interval_high=10.2,
            model_name="XGBoost Regressor v2.4",
            status="Critical",
            early_warning_flag=True,
            early_warning_trigger="EARLY WARNING DETECTED: Progress lag deviation +12%, clearance delay +2 months, expenditure burn spike.",
            primary_driver="Progress Lag"
        )
        db.add(hero_project)
        db.flush()

        # Hero project monthly history: 6 months showing 54 -> 62 -> 71 -> 79 -> 82
        hero_history = [
            ProjectMonthlyUpdate(
                project_id="P10291",
                month_year="2026-04",
                risk_score=54,
                physical_progress_pct=38.0,
                planned_progress_pct=43.0,
                cumulative_expenditure_cr=620.0,
                expenditure_burn_rate=0.92,
                clearance_delay_months=0.5,
                land_acquisition_pct=92.0,
                contractor_efficiency_score=88.0,
                delay_months=1.5
            ),
            ProjectMonthlyUpdate(
                project_id="P10291",
                month_year="2026-05",
                risk_score=60,
                physical_progress_pct=41.0,
                planned_progress_pct=48.0,
                cumulative_expenditure_cr=710.0,
                expenditure_burn_rate=0.95,
                clearance_delay_months=1.0,
                land_acquisition_pct=92.0,
                contractor_efficiency_score=84.0,
                delay_months=2.2
            ),
            ProjectMonthlyUpdate(
                project_id="P10291",
                month_year="2026-06",
                risk_score=67,
                physical_progress_pct=43.5,
                planned_progress_pct=53.0,
                cumulative_expenditure_cr=810.0,
                expenditure_burn_rate=1.02,
                clearance_delay_months=1.5,
                land_acquisition_pct=90.0,
                contractor_efficiency_score=80.0,
                delay_months=3.4
            ),
            ProjectMonthlyUpdate(
                project_id="P10291",
                month_year="2026-07",
                risk_score=74,
                physical_progress_pct=45.0,
                planned_progress_pct=58.0,
                cumulative_expenditure_cr=920.0,
                expenditure_burn_rate=1.08,
                clearance_delay_months=2.0,
                land_acquisition_pct=88.0,
                contractor_efficiency_score=76.0,
                delay_months=5.1
            ),
            ProjectMonthlyUpdate(
                project_id="P10291",
                month_year="2026-08",
                risk_score=79,
                physical_progress_pct=46.5,
                planned_progress_pct=62.0,
                cumulative_expenditure_cr=1010.0,
                expenditure_burn_rate=1.12,
                clearance_delay_months=2.5,
                land_acquisition_pct=86.0,
                contractor_efficiency_score=72.0,
                delay_months=6.8
            ),
            ProjectMonthlyUpdate(
                project_id="P10291",
                month_year="2026-09",
                risk_score=82,
                physical_progress_pct=48.0,
                planned_progress_pct=65.0,
                cumulative_expenditure_cr=1085.8,
                expenditure_burn_rate=1.15,
                clearance_delay_months=3.0,
                land_acquisition_pct=85.0,
                contractor_efficiency_score=69.0,
                delay_months=8.2
            )
        ]
        db.add_all(hero_history)

        # Hero project SHAP risk drivers
        hero_drivers = [
            RiskDriver(
                project_id="P10291",
                feature_name="Progress Lag",
                current_value="17.0% lag",
                expected_value="< 5.0% lag",
                contribution_score=28.5,
                severity="High",
                direction="increase_risk",
                historical_trend="Worsening (+12% over 3 mo)",
                description="Physical milestone execution has fallen 17% behind master schedule due to bridge pier staging blocks."
            ),
            RiskDriver(
                project_id="P10291",
                feature_name="Land Acquisition Delay",
                current_value="85.0% acquired",
                expected_value="95.0% acquired",
                contribution_score=22.0,
                severity="High",
                direction="increase_risk",
                historical_trend="Worsening (3 pending packages)",
                description="Disputed right-of-way across 14 km stretch in Thane & Raigad districts holding up continuous paving."
            ),
            RiskDriver(
                project_id="P10291",
                feature_name="Expenditure Burn Rate",
                current_value="1.15x expected",
                expected_value="1.00x planned",
                contribution_score=16.8,
                severity="High",
                direction="increase_risk",
                historical_trend="Worsening (+8% burn increase)",
                description="Overhead consumption outstripping physical progress due to idle machinery standing costs and material escalation."
            ),
            RiskDriver(
                project_id="P10291",
                feature_name="Pending Statutory Clearance",
                current_value="3.0 months delayed",
                expected_value="0.0 months",
                contribution_score=14.2,
                severity="Medium",
                direction="increase_risk",
                historical_trend="Worsening (+2 months delay)",
                description="Forest diversion approval for Sanjay Gandhi National Park buffer zone eco-sensitive area pending State Nodal response."
            ),
            RiskDriver(
                project_id="P10291",
                feature_name="Contractor Performance",
                current_value="69 / 100",
                expected_value="> 85 / 100",
                contribution_score=11.5,
                severity="Medium",
                direction="increase_risk",
                historical_trend="Worsening (-15 pts)",
                description="Tier-1 EPC consortium reporting sub-contractor liquidity deficits and delayed plant mobilization."
            )
        ]
        db.add_all(hero_drivers)

        # Generate 519 additional realistic projects (Total 520 projects)
        print("Generating 519 additional realistic infrastructure projects...")
        random.seed(42)
        
        project_types = [
            ("Dedicated Freight Corridor Package", "Railways", "Ministry of Railways"),
            ("National Express Highway 6-Laning", "Roads & Highways", "Ministry of Road Transport and Highways"),
            ("Ultra Mega Solar Park Grid Integration", "Power & Renewable Energy", "Ministry of New and Renewable Energy"),
            ("Deepwater Terminal Expansion", "Ports & Shipping", "Ministry of Ports, Shipping and Waterways"),
            ("Cross-Country Natural Gas Trunk Pipeline", "Petroleum & Natural Gas", "Ministry of Petroleum and Natural Gas"),
            ("Metro Rapid Transit Line Extension", "Urban Transport / Metro", "Ministry of Housing and Urban Affairs"),
            ("Heavy Coking Coal Washery & Evacuation", "Coal & Mining", "Ministry of Coal"),
            ("High-Speed Rail Viaduct Construction", "Railways", "Ministry of Railways"),
            ("Multi-Modal Logistics Park Phase I", "Roads & Highways", "Ministry of Commerce and Industry"),
            ("Inter-State River Linking Aqueduct", "Water Resources & Sanitation", "Ministry of Jal Shakti"),
            ("Greenfield International Airport Terminal", "Civil Aviation & Airports", "Ministry of Civil Aviation"),
            ("Smart Grid Transmission Substation Loop", "Power & Renewable Energy", "Ministry of Power"),
            ("Supercritical Thermal Power Expansion", "Power & Renewable Energy", "Ministry of Power"),
            ("Border Road Connectivity Tunnel", "Roads & Highways", "Ministry of Road Transport and Highways"),
            ("Petrochemical Complex Olefin Cracker", "Petroleum & Natural Gas", "Ministry of Petroleum and Natural Gas")
        ]

        additional_projects = []
        monthly_updates = []
        risk_drivers_list = []

        # We want approximately 15% High Risk, 35% Monitor, 50% Stable
        for i in range(1, 521):
            p_id = f"P{10000 + i}"
            if p_id == "P10291":
                continue
            title_template, sec_name, min_name = random.choice(project_types)
            st_data = random.choice(STATES_DATA)
            st_name = st_data["name"]
            p_name = f"{title_template} - {st_name} Reach {((i % 5) + 1)}"
            
            # Cost distribution in crores: 150 to 8500 Cr
            orig_cost = round(random.uniform(250.0, 4800.0), 1)
            
            # Risk profile logic with realistic correlation
            tier_rand = random.random()
            if tier_rand < 0.16: # High Risk
                risk_score = random.randint(70, 94)
                risk_cat = "High Risk"
                status = random.choice(["Critical", "Critical", "Under Review"])
                cost_risk = round(random.uniform(0.68, 0.92), 2)
                time_risk = round(random.uniform(0.70, 0.95), 2)
                lag_pct = round(random.uniform(12.0, 26.0), 1)
                burn_rate = round(random.uniform(1.08, 1.35), 2)
                cost_overrun_cr = round(orig_cost * random.uniform(0.12, 0.35), 1)
                rev_cost = round(orig_cost + cost_overrun_cr, 1)
                exp_delay = round(random.uniform(6.0, 18.0), 1)
                early_warn = True
                primary_driver = random.choice([
                    "Progress Lag", "Land Acquisition Delay", "Pending Statutory Clearance",
                    "Expenditure Burn Rate", "Contractor Performance"
                ])
                risk_change = random.randint(8, 22)
            elif tier_rand < 0.50: # Monitor
                risk_score = random.randint(40, 69)
                risk_cat = "Monitor"
                status = random.choice(["Monitor", "Active", "Under Review"])
                cost_risk = round(random.uniform(0.38, 0.65), 2)
                time_risk = round(random.uniform(0.40, 0.68), 2)
                lag_pct = round(random.uniform(4.0, 11.5), 1)
                burn_rate = round(random.uniform(0.95, 1.10), 2)
                cost_overrun_cr = round(orig_cost * random.uniform(0.04, 0.12), 1)
                rev_cost = round(orig_cost + cost_overrun_cr, 1)
                exp_delay = round(random.uniform(2.5, 6.0), 1)
                early_warn = random.random() < 0.35
                primary_driver = random.choice([
                    "Contractor Efficiency", "Utility Shifting", "Procurement Cycle", "Pending Clearance"
                ])
                risk_change = random.randint(-4, 7)
            else: # Stable
                risk_score = random.randint(12, 39)
                risk_cat = "Stable"
                status = "Active"
                cost_risk = round(random.uniform(0.08, 0.32), 2)
                time_risk = round(random.uniform(0.10, 0.35), 2)
                lag_pct = round(random.uniform(0.0, 3.8), 1)
                burn_rate = round(random.uniform(0.90, 1.02), 2)
                cost_overrun_cr = round(orig_cost * random.uniform(0.0, 0.04), 1)
                rev_cost = round(orig_cost + cost_overrun_cr, 1)
                exp_delay = round(random.uniform(0.0, 2.0), 1)
                early_warn = False
                primary_driver = "Nominal Schedule Tracking"
                risk_change = random.randint(-8, 3)

            planned_prog = round(random.uniform(35.0, 85.0), 1)
            phys_prog = max(5.0, round(planned_prog - lag_pct, 1))
            fin_prog = min(98.0, round(phys_prog * random.uniform(0.95, 1.18), 1))
            cum_exp = round((rev_cost * (fin_prog / 100.0)), 1)
            prev_risk = max(10, min(99, risk_score - risk_change))

            proj = Project(
                id=p_id,
                name=p_name,
                ministry_name=min_name,
                sector_name=sec_name,
                state_name=st_name,
                original_cost=orig_cost,
                revised_cost=rev_cost,
                cumulative_expenditure=cum_exp,
                start_date="2023-03-15",
                original_completion_date="2026-06-30",
                anticipated_completion_date="2027-02-28",
                physical_progress_pct=phys_prog,
                planned_progress_pct=planned_prog,
                progress_lag_pct=lag_pct,
                financial_progress_pct=fin_prog,
                current_risk_score=risk_score,
                previous_risk_score=prev_risk,
                risk_category=risk_cat,
                risk_change=risk_change,
                cost_risk_prob=cost_risk,
                time_risk_prob=time_risk,
                expected_cost_overrun_cr=cost_overrun_cr,
                expected_delay_months=exp_delay,
                prediction_confidence=round(random.uniform(0.82, 0.94), 2),
                confidence_interval_low=round(max(0.5, exp_delay - random.uniform(1.2, 2.5)), 1),
                confidence_interval_high=round(exp_delay + random.uniform(1.5, 3.5), 1),
                model_name="XGBoost Regressor v2.4",
                status=status,
                early_warning_flag=early_warn,
                early_warning_trigger=f"Alert: Risk trend changed by {risk_change:+d} points with {lag_pct}% lag" if early_warn else None,
                primary_driver=primary_driver
            )
            additional_projects.append(proj)

            # Generate monthly updates for recent 4 months
            m_scores = [
                max(10, min(98, int(prev_risk - (risk_change * 0.7)))),
                max(10, min(98, int(prev_risk - (risk_change * 0.3)))),
                prev_risk,
                risk_score
            ]
            months = ["2026-06", "2026-07", "2026-08", "2026-09"]
            for m_idx, m_str in enumerate(months):
                monthly_updates.append(ProjectMonthlyUpdate(
                    project_id=p_id,
                    month_year=m_str,
                    risk_score=m_scores[m_idx],
                    physical_progress_pct=max(5.0, round(phys_prog - ((3 - m_idx) * 2.5), 1)),
                    planned_progress_pct=max(10.0, round(planned_prog - ((3 - m_idx) * 2.2), 1)),
                    cumulative_expenditure_cr=round(cum_exp * (0.85 + (m_idx * 0.05)), 1),
                    expenditure_burn_rate=round(burn_rate * (0.92 + (m_idx * 0.03)), 2),
                    clearance_delay_months=round(max(0.0, (exp_delay * 0.4) - (3 - m_idx) * 0.3), 1),
                    land_acquisition_pct=round(min(100.0, 75.0 + (m_idx * 4.0) + (10 if risk_cat == "Stable" else 0)), 1),
                    contractor_efficiency_score=round(max(50.0, 90.0 - (risk_score * 0.3) + random.uniform(-4, 4)), 1),
                    delay_months=round(max(0.0, exp_delay - ((3 - m_idx) * 0.8)), 1)
                ))

            # Add 3 primary risk drivers for each project
            driver_candidates = [
                ("Progress Lag", f"{lag_pct}% lag", "< 5% lag", round(lag_pct * 1.5, 1)),
                ("Expenditure Burn", f"{burn_rate:.2f}x burn", "1.0x baseline", round((burn_rate - 0.9) * 25, 1)),
                ("Pending Clearance", f"{exp_delay * 0.3:.1f} mo delay", "0.0 mo", round(exp_delay * 1.8, 1)),
                ("Contractor Efficiency", f"{int(max(55, 95 - risk_score * 0.35))}/100", "> 85/100", round(risk_score * 0.22, 1)),
                ("Land Acquisition", f"{int(min(98, 70 + (100 - risk_score) * 0.3))}% complete", "> 95%", round(risk_score * 0.18, 1))
            ]
            for dc in driver_candidates[:3]:
                risk_drivers_list.append(RiskDriver(
                    project_id=p_id,
                    feature_name=dc[0],
                    current_value=dc[1],
                    expected_value=dc[2],
                    contribution_score=max(2.0, dc[3]),
                    severity="High" if risk_score > 70 else ("Medium" if risk_score > 40 else "Low"),
                    direction="increase_risk" if risk_score > 40 else "mitigating",
                    historical_trend="Worsening" if risk_change > 0 else "Improving",
                    description=f"Automated SHAP attribution calculated from temporal monthly tracking."
                ))

        db.bulk_save_objects(additional_projects)
        db.bulk_save_objects(monthly_updates)
        db.bulk_save_objects(risk_drivers_list)
        db.commit()

        # Seed realistic Action Hub entries (both pending and completed with Actual vs Predicted)
        print("Seeding Action Hub sample actions...")
        sample_actions = [
            Action(
                id="ACT-2026-0082",
                project_id="P10204",
                intervention_name="Fast-track Statutory Clearances",
                intervention_category="Administrative",
                recommended_date="2026-07-15",
                approved_by="Dr. Vikram Sharma, MoSPI",
                assigned_officer="Superintending Engineer P. Roy",
                expected_impact_summary="Clear Stage-II forest diversion for Korba coal evacuation line.",
                deadline="2026-08-30",
                status="Completed",
                estimated_cost_cr=15.0,
                actual_cost_cr=14.2,
                predicted_time_saving_months=2.0,
                actual_time_saving_months=1.8,
                predicted_cost_saving_cr=25.0,
                actual_cost_saving_cr=23.5,
                outcome_notes="Provisional Stage-II clearance granted via PMG single window. Work restarted 1.8 months ahead of original slippage."
            ),
            Action(
                id="ACT-2026-0091",
                project_id="P10312",
                intervention_name="Accelerate Land Acquisition",
                intervention_category="Administrative",
                recommended_date="2026-08-02",
                approved_by="Dr. Vikram Sharma, MoSPI",
                assigned_officer="Joint Collector S. Kulkarni",
                expected_impact_summary="Resolve 12 disputed RoW compensation packages in Belgavi sector.",
                deadline="2026-09-15",
                status="Completed",
                estimated_cost_cr=35.0,
                actual_cost_cr=34.0,
                predicted_time_saving_months=5.0,
                actual_time_saving_months=3.8,
                predicted_cost_saving_cr=40.0,
                actual_cost_saving_cr=34.0,
                outcome_notes="Special land tribunal settled 10 out of 12 parcels. 3.8 months saved vs predicted 5.0 months. Feedback recorded for model recalibration."
            ),
            Action(
                id="ACT-2026-0101",
                project_id="P10355",
                intervention_name="Parallel Contractor Deployment",
                intervention_category="Operational",
                recommended_date="2026-08-20",
                approved_by="Dr. Vikram Sharma, MoSPI",
                assigned_officer="Chief Engineer R. K. Nair",
                expected_impact_summary="Split pier casting into two simultaneous packages with auxiliary yard.",
                deadline="2026-10-30",
                status="In Progress",
                estimated_cost_cr=45.0,
                predicted_time_saving_months=3.5,
                predicted_cost_saving_cr=42.0,
                notes="Secondary contractor mobilized on 2026-09-05. Paving equipment operational on site."
            ),
            Action(
                id="ACT-2026-0104",
                project_id="P10291",
                intervention_name="Accelerate Land Acquisition & SLA Fast-Track",
                intervention_category="Administrative",
                recommended_date="2026-09-28",
                approved_by="Pending Review",
                assigned_officer="Project Monitoring Officer (MoSPI)",
                expected_impact_summary="Mobilize district collector task force and state SLA fast-track window for pending Thane right-of-way packages.",
                deadline="2026-11-15",
                status="Pending Approval",
                estimated_cost_cr=35.0,
                predicted_time_saving_months=3.1,
                predicted_cost_saving_cr=35.0,
                notes="Auto-recommended by PAIMANA Pulse Optimization Engine under ₹100 Cr budget constraint."
            )
        ]
        db.add_all(sample_actions)
        db.flush()

        # Seed audit updates for actions
        action_updates = [
            ActionUpdate(
                action_id="ACT-2026-0091",
                timestamp="2026-08-02 09:32",
                author="System Engine",
                previous_status="None",
                new_status="Recommended",
                comments="Early warning alert triggered risk deviation > 15 pts. Recommended land acquisition SLA."
            ),
            ActionUpdate(
                action_id="ACT-2026-0091",
                timestamp="2026-08-02 10:04",
                author="Dr. Vikram Sharma (Monitoring Officer)",
                previous_status="Recommended",
                new_status="Pending Approval",
                comments="Reviewed what-if simulation results and budget envelope feasibility."
            ),
            ActionUpdate(
                action_id="ACT-2026-0091",
                timestamp="2026-08-02 10:07",
                author="Ananya Patel, IAS (DG DIID)",
                previous_status="Pending Approval",
                new_status="Approved",
                comments="Approved fast-track escrow allocation of ₹35 Cr."
            ),
            ActionUpdate(
                action_id="ACT-2026-0091",
                timestamp="2026-08-05 11:30",
                author="Joint Collector S. Kulkarni",
                previous_status="Approved",
                new_status="In Progress",
                comments="District task force mobilized on ground with gazette notification."
            ),
            ActionUpdate(
                action_id="ACT-2026-0091",
                timestamp="2026-09-18 16:45",
                author="Dr. Vikram Sharma (Monitoring Officer)",
                previous_status="In Progress",
                new_status="Completed",
                comments="Physical RoW access handed over to EPC contractor. Actual savings verified."
            ),
            ActionUpdate(
                action_id="ACT-2026-0104",
                timestamp="2026-09-28 09:32",
                author="System Engine (OR-Tools)",
                previous_status="None",
                new_status="Recommended",
                comments="Recommendation generated based on multi-criteria optimization under ₹100 Cr budget."
            )
        ]
        db.add_all(action_updates)
        db.commit()

        # Seed audit logs
        audit_logs = [
            AuditLog(user_name="Dr. Vikram Sharma", user_role="MONITORING_OFFICER", action_type="PROJECT_VIEWED", entity_type="Project", entity_id="P10291", details="Viewed Project Pulse diagnostic view."),
            AuditLog(user_name="Dr. Vikram Sharma", user_role="MONITORING_OFFICER", action_type="SIMULATION_EXECUTED", entity_type="Simulation", entity_id="SIM-9021", details="Simulated 'Accelerate Land Acquisition' + 'Increase Fund Release'."),
            AuditLog(user_name="Dr. Vikram Sharma", user_role="MONITORING_OFFICER", action_type="RECOMMENDATION_GENERATED", entity_type="Optimization", entity_id="P10291", details="Ran budget optimization for ₹100 Cr, 50 manpower."),
            AuditLog(user_name="Ananya Patel, IAS", user_role="ADMIN", action_type="ACTION_APPROVED", entity_type="Action", entity_id="ACT-2026-0091", details="Approved fast-track RoW clearance funding.")
        ]
        db.add_all(audit_logs)
        db.commit()

        print("Database successfully seeded with 520 projects and full relational context!")
    except Exception as e:
        db.rollback()
        print(f"Error during seeding: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
