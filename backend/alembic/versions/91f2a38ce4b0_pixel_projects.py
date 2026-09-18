"""Private Pixel Studio project and PNG autosaves."""

from alembic import op
import sqlalchemy as sa

revision = "91f2a38ce4b0"
down_revision = "2998c4be95c8"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "pixel_projects",
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), primary_key=True),
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("mode", sa.String(20), nullable=False),
        sa.Column("width", sa.Integer(), nullable=False),
        sa.Column("height", sa.Integer(), nullable=False),
        sa.Column("frame_count", sa.Integer(), nullable=False),
        sa.Column("preview_frame", sa.Integer(), nullable=False),
        sa.Column("document", sa.LargeBinary(), nullable=False),
        sa.Column("preview", sa.LargeBinary(), nullable=False),
        sa.Column("thumbnail", sa.LargeBinary(), nullable=False),
        sa.Column("storage_bytes", sa.Integer(), nullable=False),
        sa.Column("revision", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.String(40), nullable=False),
        sa.Column("updated_at", sa.String(40), nullable=False),
    )
    op.create_index("ix_pixel_projects_updated_at", "pixel_projects", ["updated_at"])


def downgrade():
    op.drop_index("ix_pixel_projects_updated_at", table_name="pixel_projects")
    op.drop_table("pixel_projects")
