from api.database import db
from datetime import datetime

class Item(db.Model):
    __tablename__ = 'items'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=True, index=True)
    name = db.Column(db.String(255), nullable=False, index=True)
    item_type = db.Column(db.SmallInteger, nullable=False, index=True) # 1: 食材, 2: 仕込み品, 3: お品
    store = db.Column(db.String(100), nullable=False, index=True)
    price = db.Column(db.Numeric(10, 2), nullable=False)
    quantity = db.Column(db.Numeric(10, 2), nullable=False)
    unit = db.Column(db.String(20), nullable=False)
    unit_price = db.Column(db.Numeric(10, 4), nullable=False)
    selling_price = db.Column(db.Numeric(10, 2), nullable=True)
    store_id = db.Column(db.Integer, db.ForeignKey('stores.id', ondelete='SET NULL'), nullable=True, index=True)
    genre = db.Column(db.String(50), nullable=True)
    description = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    used_in = db.relationship(
        'ItemRelation',
        foreign_keys='ItemRelation.child_item_id',
        backref='child_item',
        lazy='dynamic',
        cascade='all, delete-orphan'
    )
    made_of = db.relationship(
        'ItemRelation',
        foreign_keys='ItemRelation.parent_item_id',
        backref='parent_item',
        lazy='dynamic',
        cascade='all, delete-orphan'
    )

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'item_type': self.item_type,
            'store': self.store,
            'price': float(self.price) if self.price is not None else 0,
            'quantity': float(self.quantity) if self.quantity is not None else 0,
            'unit': self.unit,
            'unit_price': float(self.unit_price) if self.unit_price is not None else 0,
            'selling_price': float(self.selling_price) if self.selling_price is not None else None,
            'store_id': self.store_id,
            'genre': self.genre,
            'description': self.description,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class ItemRelation(db.Model):
    __tablename__ = 'item_relations'
    __table_args__ = (
        db.UniqueConstraint('parent_item_id', 'child_item_id', name='uk_parent_child'),
    )

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    parent_item_id = db.Column(db.Integer, db.ForeignKey('items.id', ondelete='CASCADE'), nullable=False, index=True)
    child_item_id = db.Column(db.Integer, db.ForeignKey('items.id', ondelete='RESTRICT'), nullable=False, index=True)
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    cost = db.Column(db.Numeric(10, 2), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'parent_item_id': self.parent_item_id,
            'child_item_id': self.child_item_id,
            'amount': float(self.amount) if self.amount is not None else 0,
            'cost': float(self.cost) if self.cost is not None else 0,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
