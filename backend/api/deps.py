from typing import Optional, Tuple
from fastapi import Header, Query, HTTPException, Depends
from backend.models.schemas import UserRole


ROLE_MAPPINGS = {
    "product_manager": UserRole.PRODUCT_MANAGER,
    "pm": UserRole.PRODUCT_MANAGER,
    "product manager": UserRole.PRODUCT_MANAGER,
    "systems_engineer": UserRole.SYSTEMS_ENGINEER,
    "engineer": UserRole.SYSTEMS_ENGINEER,
    "lead_engineer": UserRole.SYSTEMS_ENGINEER,
    "lead systems engineer": UserRole.SYSTEMS_ENGINEER,
    "executive": UserRole.EXECUTIVE,
    "senior_manager": UserRole.EXECUTIVE,
    "exec": UserRole.EXECUTIVE,
    "senior manager": UserRole.EXECUTIVE,
}


def get_user_role(
    x_user_role: Optional[str] = Header(None, alias="X-User-Role"),
    role: Optional[str] = Query(None)
) -> Tuple[UserRole, bool]:
    """
    Extract enterprise persona from X-User-Role header or 'role' query parameter.
    Returns (UserRole, is_explicit).
    Default is (UserRole.PRODUCT_MANAGER, False) if not specified.
    """
    raw_role = x_user_role or role
    if not raw_role:
        return UserRole.PRODUCT_MANAGER, False

    normalized = raw_role.strip().lower()
    if normalized in ROLE_MAPPINGS:
        return ROLE_MAPPINGS[normalized], True

    raise HTTPException(
        status_code=400,
        detail=(
            f"Invalid role '{raw_role}'. Supported roles are: "
            "'product_manager' (or 'pm'), 'systems_engineer' (or 'engineer'), 'executive' (or 'senior_manager')."
        )
    )


def require_write_permission(
    user_context: Tuple[UserRole, bool] = Depends(get_user_role)
) -> UserRole:
    """
    Gate for mutation endpoints: Executives are strictly read-only.
    """
    role, _ = user_context
    if role == UserRole.EXECUTIVE:
        raise HTTPException(
            status_code=403,
            detail="Executive persona is strictly read-only. Mutation operations are prohibited."
        )
    return role


def verify_dual_key_role_action(
    action: str,
    user_context: Tuple[UserRole, bool]
):
    """
    Enforce Dual-Key separation of duties:
    - Product Managers cannot grant technical sign-off (lock_baseline).
    - Lead Systems Engineers cannot author provisional PM targets (provisional_pm).
    - Executives cannot perform any dual-key mutations.
    """
    role, is_explicit = user_context
    if role == UserRole.EXECUTIVE:
        raise HTTPException(
            status_code=403,
            detail="Executive persona is strictly read-only. Dual-key transitions are prohibited."
        )

    if is_explicit:
        if role == UserRole.PRODUCT_MANAGER and action == "lock_baseline":
            raise HTTPException(
                status_code=403,
                detail="Dual-Key Policy Violation: Formal baseline locking requires Lead Systems Engineer technical sign-off."
            )
        if role == UserRole.SYSTEMS_ENGINEER and action == "provisional_pm":
            raise HTTPException(
                status_code=403,
                detail="Dual-Key Policy Violation: Setting provisional values is reserved for Product Managers."
            )
