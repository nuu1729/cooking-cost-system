from datetime import datetime, timezone
from api.database import db


class RevokedToken(db.Model):
    __tablename__ = 'revoked_tokens'

    id = db.Column(db.Integer, primary_key=True)
    jti = db.Column(db.String(36), unique=True, nullable=False, index=True)
    revoked_at = db.Column(db.DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    expires_at = db.Column(db.DateTime(timezone=True), nullable=False)

    @classmethod
    def is_revoked(cls, jti: str) -> bool:
        return cls.query.filter_by(jti=jti).first() is not None

    @classmethod
    def cleanup_expired(cls):
        cls.query.filter(cls.expires_at < datetime.now(timezone.utc)).delete()
        db.session.commit()
