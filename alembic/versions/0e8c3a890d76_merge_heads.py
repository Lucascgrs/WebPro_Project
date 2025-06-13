"""merge heads

Revision ID: 0e8c3a890d76
Revises: add_profile_photo, dcf7523ec8c6
Create Date: 2025-06-13 03:26:04.943513

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0e8c3a890d76'
down_revision: Union[str, None] = ('add_profile_photo', 'dcf7523ec8c6')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
