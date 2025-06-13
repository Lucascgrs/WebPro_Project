from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_profile_photo'
down_revision = None  # Replace with your last migration's revision ID
branch_labels = None
depends_on = None


def upgrade():
    # Add profile_photo column to user table
    op.add_column('user', sa.Column('profile_photo', sa.String(255), nullable=True))


def downgrade():
    # Remove profile_photo column from user table
    op.drop_column('user', 'profile_photo')