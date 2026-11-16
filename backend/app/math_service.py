"""Safe AST-based arithmetic calculator service.

Evaluates deterministic arithmetic expressions without using eval() or shell exec.
Supports: +, -, *, x, /, %, ^, ** and basic parentheses.
Handles phrasing like:
- "Calculate 245 x 67"
- "What is 15000 + 45000?"
- "245 * 67"
- "Calculate 100 / 4"
"""

from __future__ import annotations

import ast
import operator
import re
from typing import Any

# Allowed operators mapping
OPERATORS: dict[type[ast.AST], Any] = {
    ast.Add: operator.add,
    ast.Sub: operator.sub,
    ast.Mult: operator.mul,
    ast.Div: operator.truediv,
    ast.Pow: operator.pow,
    ast.Mod: operator.mod,
    ast.USub: operator.neg,
    ast.UAdd: operator.pos,
}

CALCULATE_TRIGGERS = [
    r"calculate\s+(.+)",
    r"what\s+is\s+([0-9\.\s\+\-\*\/\^\%xX\(\)]+)\??",
    r"how\s+much\s+is\s+([0-9\.\s\+\-\*\/\^\%xX\(\)]+)\??",
    r"^([0-9\.\s\+\-\*\/\^\%xX\(\)]+)$",
]


def _eval_ast_node(node: ast.AST) -> float | int:
    """Recursively evaluate an AST node safely."""
    if isinstance(node, ast.Constant):
        if isinstance(node.value, (int, float)):
            return node.value
        raise ValueError("Non-numeric literal in expression")

    if isinstance(node, ast.BinOp):
        op_type = type(node.op)
        if op_type not in OPERATORS:
            raise ValueError(f"Unsupported operator: {op_type}")
        left = _eval_ast_node(node.left)
        right = _eval_ast_node(node.right)
        op_func = OPERATORS[op_type]
        if op_type == ast.Div and right == 0:
            raise ZeroDivisionError("Division by zero")
        return op_func(left, right)

    if isinstance(node, ast.UnaryOp):
        op_type = type(node.op)
        if op_type not in OPERATORS:
            raise ValueError(f"Unsupported unary operator: {op_type}")
        operand = _eval_ast_node(node.operand)
        return OPERATORS[op_type](operand)

    raise ValueError(f"Unsupported AST node: {type(node)}")


def is_math_query(text: str) -> bool:
    """Determine whether text is an arithmetic math inquiry."""
    clean = text.strip()
    # Check calculate prefix
    if re.search(r"\b(calculate|compute|solve)\b\s+[\d\(\.\-\+]", clean, re.IGNORECASE):
        return True

    # Check for math operators between numbers
    if re.search(r"\d+\s*[\+\-\*\/xX\^\%]\s*\d+", clean):
        # Discard phone numbers or dates (e.g., 2026-11-15 or +91-5942-236361)
        if re.search(r"\b\d{4}-\d{2}-\d{2}\b", clean) or re.search(r"\+91[-\s]?\d+", clean):
            return False
        return True

    return False


def extract_math_expression(text: str) -> str | None:
    """Extract clean mathematical expression string from user query."""
    clean = text.strip()
    # Normalize 'x' or 'X' to '*'
    for pattern in CALCULATE_TRIGGERS:
        match = re.search(pattern, clean, re.IGNORECASE)
        if match:
            candidate = match.group(1).strip()
            # Replace 'x' or 'X' with '*' when preceded and followed by digits/whitespace
            normalized = re.sub(r"(?<=\d)\s*[xX]\s*(?=\d)", " * ", candidate)
            normalized = normalized.replace("^", "**")
            return normalized.strip()

    # Fallback: extract substring with digits and operators
    m = re.search(r"([\d\.\s\+\-\*\/\^\%xX\(\)]+)", clean)
    if m:
        sub = m.group(1).strip()
        normalized = re.sub(r"(?<=\d)\s*[xX]\s*(?=\d)", " * ", sub)
        normalized = normalized.replace("^", "**")
        return normalized.strip()

    return None


def calculate_expression(expression: str) -> tuple[float | int | None, str | None]:
    """Safely calculate expression. Returns (result, error_message)."""
    try:
        # Parse expression into AST
        parsed = ast.parse(expression, mode="eval")
        result = _eval_ast_node(parsed.body)
        if isinstance(result, float) and result.is_integer():
            result = int(result)
        return result, None
    except ZeroDivisionError:
        return None, "Error: Division by zero is undefined."
    except Exception as exc:
        return None, f"Invalid mathematical expression ({exc})."


def format_math_reply(query: str) -> str | None:
    """Generate friendly user-facing math response."""
    expr = extract_math_expression(query)
    if not expr:
        return None

    result, err = calculate_expression(expr)
    if err:
        return f"I could not calculate that: {err}"

    readable_expr = expr.replace("**", "^").replace("*", "×")
    return f"**Result**: `{readable_expr} = {result:,}`" if isinstance(result, int) else f"**Result**: `{readable_expr} = {result}`"

