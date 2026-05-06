from api.database import db
from api.models.item import Item, ItemRelation


def _recalculate_prep(prep_id: int) -> None:
    prep = Item.query.filter_by(id=prep_id, item_type=2).first()
    if not prep:
        return

    rels = db.session.query(ItemRelation, Item).join(
        Item, ItemRelation.child_item_id == Item.id
    ).filter(ItemRelation.parent_item_id == prep_id).all()

    if not rels:
        return

    total_cost = 0.0
    for rel, ing in rels:
        cost = round(float(ing.unit_price) * float(rel.amount), 2)
        rel.cost = cost
        total_cost += cost

    total_cost = round(total_cost, 2)
    prep.price = total_cost
    prep.unit_price = round(total_cost / float(prep.quantity), 4)


def _recalculate_dish(dish_id: int) -> None:
    dish = Item.query.filter_by(id=dish_id, item_type=3).first()
    if not dish:
        return

    rels = db.session.query(ItemRelation, Item).join(
        Item, ItemRelation.child_item_id == Item.id
    ).filter(ItemRelation.parent_item_id == dish_id).all()

    if not rels:
        return

    total_cost = 0.0
    for rel, prep in rels:
        cost = round(float(prep.unit_price) * float(rel.amount), 2)
        rel.cost = cost
        total_cost += cost

    total_cost = round(total_cost, 2)
    dish.price = total_cost
    dish.unit_price = round(total_cost / float(dish.quantity), 4)


def cascade_from_ingredient(ingredient_id: int) -> None:
    """食材の unit_price 変更を仕込み → お品へ伝播する。
    呼び出し前に db.session.flush() で食材の変更を反映しておくこと。
    """
    # この食材を使う仕込みを特定
    prep_ids = [
        r[0] for r in db.session.query(ItemRelation.parent_item_id)
        .join(Item, ItemRelation.parent_item_id == Item.id)
        .filter(ItemRelation.child_item_id == ingredient_id, Item.item_type == 2)
        .distinct().all()
    ]
    if not prep_ids:
        return

    for prep_id in prep_ids:
        _recalculate_prep(prep_id)

    # 影響を受けた仕込みを使うお品を特定して再計算
    dish_ids = [
        r[0] for r in db.session.query(ItemRelation.parent_item_id)
        .join(Item, ItemRelation.parent_item_id == Item.id)
        .filter(ItemRelation.child_item_id.in_(prep_ids), Item.item_type == 3)
        .distinct().all()
    ]
    for dish_id in dish_ids:
        _recalculate_dish(dish_id)
