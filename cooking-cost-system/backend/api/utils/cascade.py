from __future__ import annotations

from api.database import db
from api.models.item import Item, ItemRelation

# D1 batch API のエンドポイント（account_id・database_id は呼び出し時に埋め込む）
_D1_QUERY_URL = 'https://api.cloudflare.com/client/v4/accounts/{account_id}/d1/database/{database_id}/query'

# D1 batch リクエストのタイムアウト（秒）。httpx は同期呼び出しのため、
# gunicorn がスレッド/sync ワーカーの場合はこの秒数までワーカーを占有する。
# #174（Containers パッケージング）でランタイムモデルが変わる際に見直すこと。
_D1_REQUEST_TIMEOUT = 10.0


def _is_d1() -> bool:
    """DB エンジンが Cloudflare D1 かどうかを判定する。

    D1 の REST API は明示的なトランザクションをサポートせず、各クエリが個別に
    auto-commit される（sqlalchemy-cloudflare-d1 自身のドキュメントにも明記）。
    #171 spike の実測でも、ORM の複数行 UPDATE を含む session.commit() が
    部分的にしかコミットされないことを確認済み。そのため D1 接続時は
    このモジュールの再計算処理を ORM のオブジェクト変更ではなく、
    D1 の batch エンドポイントへの直接呼び出しに切り替える。
    MySQL（ローカル開発環境）では従来どおり ORM 経由で動作する。"""
    return db.engine.dialect.name == 'cloudflare_d1'


def _d1_batch_execute(statements: list[tuple[str, list]]) -> None:
    """D1 REST API の /query に batch 配列を POST し、複数の SQL 文を原子的に実行する。

    #171 spike で実測済み: batch 配列内のいずれかの文が失敗すると、
    先行する文も含めて全てロールバックされる（all-or-nothing）。

    失敗時は例外を送出する。呼び出し元で個別に catch せず、Flask の
    エラーハンドラに委ねる（ORM の db.session.commit() 失敗時と同じ失敗経路に統一するため）。
    """
    import httpx
    from flask import current_app

    account_id = current_app.config['CF_ACCOUNT_ID']
    database_id = current_app.config['CF_D1_DATABASE_ID']
    api_token = current_app.config['CF_D1_API_TOKEN']
    url = _D1_QUERY_URL.format(account_id=account_id, database_id=database_id)

    batch = [{'sql': sql, 'params': params} for sql, params in statements]
    try:
        response = httpx.post(
            url,
            headers={'Authorization': f'Bearer {api_token}', 'Content-Type': 'application/json'},
            json={'batch': batch},
            timeout=_D1_REQUEST_TIMEOUT,
        )
        response.raise_for_status()
    except httpx.HTTPStatusError as e:
        # 5xx/429 等でレスポンスが JSON でない場合（Cloudflare のエラーページ等）に
        # response.json() が JSONDecodeError を投げるのを防ぐため、ここで先に検出する
        raise RuntimeError(f'D1 batch HTTP エラー: {e.response.status_code}') from e
    except httpx.RequestError as e:
        raise RuntimeError(f'D1 batch リクエストに失敗しました: {e}') from e

    data = response.json()
    if not data.get('success'):
        errors = data.get('errors', [])
        message = errors[0]['message'] if errors else f'D1 batch 実行に失敗しました（HTTP {response.status_code}）'
        raise RuntimeError(f'D1 batch error: {message}')


def _recalculate_prep(
    prep_id: int,
    statements: list[tuple[str, list]] | None = None,
    overrides: dict[int, float] | None = None,
) -> None:
    """仕込みの原価を再計算する。

    statements が None（MySQL/開発環境）の場合は従来どおり ORM オブジェクトを
    直接変更し、呼び出し元が最後に1回 db.session.commit() する前提で動作する。

    statements がリスト（D1/本番環境）の場合は UPDATE 文をリストに追加するのみで
    実行はしない（呼び出し元が最後にまとめて _d1_batch_execute する）。この場合、
    ORM オブジェクトは変更しないため、このプレップの新しい unit_price を
    overrides に記録し、後続の _recalculate_dish がこの更新後の値を参照できるようにする
    （ORM 変更なら同一セッション内で自然に見える値を、明示的に引き渡す）。

    statements と overrides は常に両方 None か両方非 None のペアで呼ばれる
    （cascade_from_ingredient() 参照）。分離した2引数にしているのは呼び出し側の
    単純さのためで、両者を束ねるデータクラスは今のところ導入していない。
    """
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
        total_cost += cost
        if statements is not None:
            statements.append(('UPDATE item_relations SET cost = ? WHERE id = ?', [cost, rel.id]))
        else:
            rel.cost = cost

    total_cost = round(total_cost, 2)
    unit_price = round(total_cost / float(prep.quantity), 4)
    if statements is not None:
        statements.append(('UPDATE items SET price = ?, unit_price = ? WHERE id = ?', [total_cost, unit_price, prep.id]))
        if overrides is not None:
            overrides[prep.id] = unit_price
    else:
        prep.price = total_cost
        prep.unit_price = unit_price


def _recalculate_dish(
    dish_id: int,
    statements: list[tuple[str, list]] | None = None,
    overrides: dict[int, float] | None = None,
) -> None:
    """お品の原価を再計算する（statements/overrides の扱いは _recalculate_prep と同様）。

    overrides に対象の仕込みの新しい unit_price が記録されていればそれを使い、
    なければ DB 上の現在値を使う（このカスケードで更新されなかった仕込みの場合）。
    """
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
        unit_price = overrides.get(prep.id, float(prep.unit_price)) if overrides is not None else float(prep.unit_price)
        cost = round(unit_price * float(rel.amount), 2)
        total_cost += cost
        if statements is not None:
            statements.append(('UPDATE item_relations SET cost = ? WHERE id = ?', [cost, rel.id]))
        else:
            rel.cost = cost

    total_cost = round(total_cost, 2)
    unit_price = round(total_cost / float(dish.quantity), 4)
    if statements is not None:
        statements.append(('UPDATE items SET price = ?, unit_price = ? WHERE id = ?', [total_cost, unit_price, dish.id]))
    else:
        dish.price = total_cost
        dish.unit_price = unit_price


def cascade_from_ingredient(ingredient_id: int) -> None:
    """食材の unit_price 変更を仕込み → お品へ伝播する。

    MySQL（開発環境）: 呼び出し前に db.session.flush() で食材の変更を反映しておくこと。
    このカスケード自体は db.session.commit() しないため、呼び出し元が最後に
    まとめて1回 commit する。

    D1（本番環境）: ORM の commit に依存せず、このカスケードの書き込み
    （仕込み・お品・関連レコードの UPDATE）を1回の D1 batch 呼び出しで
    原子的に実行してから返る。呼び出し元の db.session.flush()/commit() は
    食材自身の更新（単一行・単一 UPDATE 文のため D1 上でも原子的）にのみ影響する。
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

    is_d1 = _is_d1()
    statements: list[tuple[str, list]] | None = [] if is_d1 else None
    overrides: dict[int, float] | None = {} if is_d1 else None

    for prep_id in prep_ids:
        _recalculate_prep(prep_id, statements, overrides)

    # 影響を受けた仕込みを使うお品を特定して再計算
    dish_ids = [
        r[0] for r in db.session.query(ItemRelation.parent_item_id)
        .join(Item, ItemRelation.parent_item_id == Item.id)
        .filter(ItemRelation.child_item_id.in_(prep_ids), Item.item_type == 3)
        .distinct().all()
    ]
    for dish_id in dish_ids:
        _recalculate_dish(dish_id, statements, overrides)

    if is_d1 and statements:
        _d1_batch_execute(statements)
