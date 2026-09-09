"""Complete five-agent topology with local operational tools."""
from enum import Enum
from types import MappingProxyType
from typing import Literal
from uuid import uuid4
from pydantic import BaseModel, ConfigDict, Field


class AgentId(str, Enum):
    INTAKE = "employer_intake"
    MEDICATION = "medication_compliance"
    EXECUTION = "service_execution"
    AUDIT = "data_integrity_audit"
    REPORTING = "reporting_insights"


class RequestKind(str, Enum):
    ONBOARDING = "onboarding"
    MEDICATION = "medication"
    SERVICE = "service"
    AUDIT = "audit"
    REPORT = "report"


class AgentRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    employer_id: str = Field(min_length=1, max_length=100)
    kind: RequestKind
    message: str = Field(min_length=1, max_length=4000)


class AgentResult(BaseModel):
    model_config = ConfigDict(extra="forbid")
    request_id: str
    agent_id: AgentId
    status: Literal["planned", "needs_review", "blocked"]
    summary: str
    trace: list[AgentId]
    writes_performed: Literal[False] = False


class AgentDefinition(BaseModel):
    model_config = ConfigDict(frozen=True)
    id: AgentId
    name: str
    responsibility: str
    tools: tuple[str, ...]
    fallback: str
    execution_mode: Literal["local_rules"] = "local_rules"


REGISTRY = MappingProxyType({
    AgentId.INTAKE: AgentDefinition(id=AgentId.INTAKE,
        name="Employer Intake & Routing Agent",
        responsibility="Validate employer requests and route by explicit request kind.",
        tools=("validate_request", "route_request", "execute_operation"),
        fallback="Reject malformed input and require an explicit request kind."),
    AgentId.MEDICATION: AgentDefinition(id=AgentId.MEDICATION,
        name="Medication & Compliance Agent",
        responsibility="Own medication schedules, dosage validation and clinical logging.",
        tools=("medication_readiness", "execute_operation"),
        fallback="Reject invalid doses, stale orders and duplicate outcomes; roll back failed writes."),
    AgentId.EXECUTION: AgentDefinition(id=AgentId.EXECUTION,
        name="Service Execution Agent",
        responsibility="Own service dispatch, workforce assignment and job tracking.",
        tools=("plan_service", "execute_operation"),
        fallback="Reject invalid client references or state transitions; preserve the existing job."),
    AgentId.AUDIT: AgentDefinition(id=AgentId.AUDIT,
        name="Data Integrity & Audit Agent",
        responsibility="Verify request contracts; own transactional validation and audit trails.",
        tools=("verify_request", "verify_database"),
        fallback="Block writes on schema, reference or audit-chain inconsistencies."),
    AgentId.REPORTING: AgentDefinition(id=AgentId.REPORTING,
        name="Reporting & Insights Agent",
        responsibility="Own employer KPI, efficiency and compliance summaries.",
        tools=("report_readiness", "report_metrics"),
        fallback="Report missing operational data without inventing metrics."),
})
ROUTES = MappingProxyType({
    RequestKind.ONBOARDING: AgentId.INTAKE,
    RequestKind.MEDICATION: AgentId.MEDICATION,
    RequestKind.SERVICE: AgentId.EXECUTION,
    RequestKind.AUDIT: AgentId.AUDIT,
    RequestKind.REPORT: AgentId.REPORTING,
})


def validate_request(request: AgentRequest) -> AgentRequest:
    return AgentRequest.model_validate(request.model_dump())


def route_request(request: AgentRequest) -> AgentId:
    return ROUTES[request.kind]


def verify_request(request: AgentRequest) -> tuple[str, str]:
    validate_request(request)
    return "needs_review", "Request envelope verified. Use the authenticated employer dashboard for full database verification."


def medication_readiness(request: AgentRequest) -> tuple[str, str]:
    return "blocked", "Free-text medication changes are not allowed. Use the validated medication form to submit a prescribed scheduled dose."


def plan_service(request: AgentRequest) -> tuple[str, str]:
    return "planned", "Service request routed for review. Submit the service form with a client and assigned worker to persist dispatch."


def report_readiness(request: AgentRequest) -> tuple[str, str]:
    return "needs_review", "Open Insights for metrics calculated from the authenticated employer's operational records."


def plan_onboarding(request: AgentRequest) -> tuple[str, str]:
    return "planned", "Employer request validated and routed. Use Add workspace to persist employer onboarding."


def verify_database(db, employer_id):
    from operations import audit_verification
    return audit_verification(db, employer_id)


def execute_operation(command, actor_id, engine):
    from operations import execute
    return execute(command, actor_id, engine)


def report_metrics(records):
    from operations import report
    return report(records)


TOOLS = MappingProxyType({
    "verify_database": verify_database, "execute_operation": execute_operation,
    "report_metrics": report_metrics,
    "validate_request": validate_request, "route_request": route_request,
    "verify_request": verify_request, "medication_readiness": medication_readiness,
    "plan_service": plan_service, "report_readiness": report_readiness,
})
HANDLERS = MappingProxyType({
    AgentId.INTAKE: plan_onboarding, AgentId.MEDICATION: medication_readiness,
    AgentId.EXECUTION: plan_service, AgentId.AUDIT: verify_request,
    AgentId.REPORTING: report_readiness,
})


def verify_topology() -> None:
    if len(REGISTRY) != 5 or set(REGISTRY) != set(AgentId) or set(HANDLERS) != set(AgentId):
        raise RuntimeError("Exactly five registered and executable agents are required")
    if set(ROUTES) != set(RequestKind) or set(ROUTES.values()) != set(AgentId):
        raise RuntimeError("All request kinds must route to the five registered agents")
    for definition in REGISTRY.values():
        if any(tool not in TOOLS for tool in definition.tools):
            raise RuntimeError(f"Unbound tool for {definition.id}")


def dispatch(request: AgentRequest) -> AgentResult:
    verify_topology()
    request = validate_request(request)
    verify_request(request)
    target = route_request(request)
    status, summary = HANDLERS[target](request)
    trace = [AgentId.INTAKE, AgentId.AUDIT]
    if target not in trace:
        trace.append(target)
    return AgentResult(request_id=str(uuid4()), agent_id=target,
                       status=status, summary=summary, trace=trace)


verify_topology()
