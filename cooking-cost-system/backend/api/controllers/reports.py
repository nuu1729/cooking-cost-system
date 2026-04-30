from flask import Blueprint, request, Response
from datetime import datetime, timedelta, timezone
from sqlalchemy import func
from api.database import db
from api.models.item import Item, ItemRelation
from api.utils.response import success, error
from api.utils.auth import require_auth
import csv
import io
import json

reports_bp = Blueprint('reports', __name__)


# GET /api/reports/dashboard
@reports_bp.route('/dashboard', methods=['GET'])
@require_auth
def dashboard():
    total_ingredients = Item.query.filter_by(item_type=1).count()
    total_preps = Item.query.filter_by(item_type=2).count()
    total_foods = Item.query.filter_by(item_type=3).count()

    avg_cost_rate_row = db.session.query(
        func.avg(Item.unit_price)
    ).filter(Item.item_type == 3).scalar()
    avg_cost_rate = round(float(avg_cost_rate_row or 0), 2)

    recent_items = Item.query.order_by(Item.created_at.desc()).limit(5).all()
    type_labels = {1: '食材', 2: '仕込み品', 3: 'お品'}
    recent_activity = [{
        'id': item.id,
        'type': 'ingredient' if item.item_type == 1 else ('prep' if item.item_type == 2 else 'food'),
        'message': f'{type_labels[item.item_type]}「{item.name}」を登録',
        'timestamp': item.created_at.isoformat() + 'Z' if item.created_at else None,
    } for item in recent_items]

    return success({
        'summary': {
            'totalIngredients': total_ingredients,
            'totalPreps': total_preps,
            'totalFoods': total_foods,
            'avgCostRate': avg_cost_rate,
        },
        'recentActivity': recent_activity,
    })


# GET /api/reports/genre-stats
@reports_bp.route('/genre-stats', methods=['GET'])
@require_auth
def genre_stats():
    rows = db.session.query(
        func.coalesce(Item.genre, 'other').label('genre'),
        func.count(Item.id).label('count'),
        func.round(func.avg(Item.unit_price), 4).label('avg_unit_price')
    ).filter(Item.item_type == 1).group_by(
        func.coalesce(Item.genre, 'other')
    ).order_by(func.count(Item.id).desc()).all()

    data = [{'genre': r.genre, 'count': r.count, 'avg_unit_price': float(r.avg_unit_price or 0)} for r in rows]
    return success(data)


# GET /api/reports/cost-trends
@reports_bp.route('/cost-trends', methods=['GET'])
@require_auth
def cost_trends():
    days = max(7, min(request.args.get('days', 30, type=int), 365))
    since = datetime.now(timezone.utc) - timedelta(days=days)

    rows = db.session.query(
        func.date(Item.created_at).label('date'),
        func.round(func.avg(Item.price), 2).label('avg_cost'),
        func.count(Item.id).label('item_count')
    ).filter(
        Item.item_type == 1,
        Item.created_at >= since
    ).group_by(func.date(Item.created_at)).order_by(func.date(Item.created_at)).all()

    data = [{'date': str(r.date), 'avg_cost': float(r.avg_cost or 0), 'item_count': r.item_count} for r in rows]
    return success(data)


# GET /api/reports/popular-items
@reports_bp.route('/popular-items', methods=['GET'])
@require_auth
def popular_items():
    rows = db.session.query(
        Item.id,
        Item.name,
        Item.item_type,
        func.count(ItemRelation.id).label('usage_count')
    ).join(ItemRelation, Item.id == ItemRelation.child_item_id
    ).filter(Item.item_type.in_([1, 2])
    ).group_by(Item.id, Item.name, Item.item_type
    ).order_by(func.count(ItemRelation.id).desc()
    ).limit(10).all()

    data = [{'id': r.id, 'name': r.name, 'item_type': r.item_type, 'usage_count': r.usage_count} for r in rows]
    return success(data)


# GET /api/reports/export
@reports_bp.route('/export', methods=['GET'])
@require_auth
def export_data():
    export_type = request.args.get('type')
    export_format = request.args.get('format', 'json')

    if export_type not in ('ingredients', 'preps', 'foods', 'summary'):
        return error('VALIDATION_ERROR', 'type は ingredients / preps / foods / summary のいずれかを指定してください')

    type_map = {'ingredients': 1, 'preps': 2, 'foods': 3}
    if export_type == 'summary':
        data = {
            'totalIngredients': Item.query.filter_by(item_type=1).count(),
            'totalPreps': Item.query.filter_by(item_type=2).count(),
            'totalFoods': Item.query.filter_by(item_type=3).count(),
        }
        if export_format == 'csv':
            output = io.StringIO()
            w = csv.writer(output)
            w.writerow(data.keys())
            w.writerow(data.values())
            return Response(output.getvalue(), mimetype='text/csv',
                            headers={'Content-Disposition': 'attachment; filename=summary.csv'})
        return success(data)

    items = Item.query.filter_by(item_type=type_map[export_type]).all()
    if export_format == 'csv':
        output = io.StringIO()
        w = csv.writer(output)
        w.writerow(['id', 'name', 'store', 'price', 'quantity', 'unit', 'unit_price', 'genre', 'description'])
        for item in items:
            w.writerow([item.id, item.name, item.store, item.price, item.quantity,
                        item.unit, item.unit_price, item.genre, item.description])
        return Response(output.getvalue(), mimetype='text/csv',
                        headers={'Content-Disposition': f'attachment; filename={export_type}.csv'})

    return success([i.to_dict() for i in items])
